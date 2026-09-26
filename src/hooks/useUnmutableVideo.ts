"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** Remembers the visitor's own choice across reloads and locale switches.
 *  Only an explicit toggle writes here — a browser-refused autoplay
 *  attempt must never be recorded as "this visitor wants silence", or one
 *  policy block would permanently opt them out. */
const STORAGE_KEY = "levelup:hero-sound";

function readPreference(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== "off";
  } catch {
    // Private mode / blocked storage — fall back to the default (on).
    return true;
  }
}

function writePreference(wantsSound: boolean) {
  try {
    window.localStorage.setItem(STORAGE_KEY, wantsSound ? "on" : "off");
  } catch {
    // Nothing to do — the preference simply does not survive this session.
  }
}

/**
 * Sound controller for a background <video> plus the toggle that drives it.
 *
 * The element is rendered muted (see VideoSlot) because that is the only
 * state every browser will autoplay. This hook then *attempts* to upgrade
 * it to audible as soon as the element mounts, and degrades in documented
 * steps when the browser refuses:
 *
 *   1. unmute + play()  — works where the visitor has prior engagement
 *      with the origin, or where the site is allowed by the user's own
 *      autoplay settings.
 *   2. on rejection, re-mute and play() silently, so the footage still
 *      runs; the toggle stays on screen reading "Activer le son".
 *   3. arm one-shot pointerdown/keydown/touchstart listeners — the first
 *      real interaction anywhere on the page is a trusted gesture, which
 *      is what the policy actually requires, so the same upgrade is tried
 *      again there and the listeners are removed once it lands.
 *
 * Audible autoplay is never guaranteed: Chrome gates it on a per-origin
 * Media Engagement Index, Safari on explicit per-site permission, and
 * iOS/Android generally refuse it outright. Step 3 is what makes the
 * common case (visitor clicks or scrolls-with-a-key almost immediately)
 * feel like it simply worked.
 *
 * `unmuted` always mirrors the real element: a `volumechange` listener
 * syncs React state back from the media, so the button label can never
 * drift from what the visitor is actually hearing.
 */
export function useUnmutableVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  // Server and first client paint both render muted — this is state the
  // browser only resolves after mount, so starting it `false` keeps the
  // hydrated markup identical to the SSR output.
  const [unmuted, setUnmuted] = useState(false);
  /** What the visitor wants, independent of what the browser allows. */
  const wantsSoundRef = useRef(true);
  /** Detach function for the armed first-interaction listeners, if any. */
  const disarmRef = useRef<(() => void) | null>(null);
  /** Detach function for the previous element's `volumechange` listener. */
  const detachSyncRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    wantsSoundRef.current = readPreference();
  }, []);

  /** Plays without sound. Always safe — no browser refuses muted autoplay. */
  const playMuted = useCallback((video: HTMLVideoElement) => {
    video.muted = true;
    setUnmuted(false);
    // Swallowed on purpose: a muted play() can still reject while the
    // element is mid-load or being torn down, and an unhandled rejection
    // here would surface as a console error on an entirely normal path.
    void video.play().catch(() => {});
  }, []);

  /** Attempts audible playback. Resolves true only if the browser allowed it. */
  const tryPlayWithSound = useCallback(
    async (video: HTMLVideoElement): Promise<boolean> => {
      video.muted = false;
      video.volume = 1;
      try {
        await video.play();
        setUnmuted(true);
        return true;
      } catch {
        playMuted(video);
        return false;
      }
    },
    [playMuted]
  );

  /** Retries the upgrade on the first trusted gesture, then disarms. */
  const armFirstInteraction = useCallback(() => {
    if (disarmRef.current) return;

    const events = ["pointerdown", "keydown", "touchstart"] as const;
    const onFirstInteraction = () => {
      const video = videoRef.current;
      if (!video || !wantsSoundRef.current) {
        disarmRef.current?.();
        return;
      }
      void tryPlayWithSound(video).then((ok) => {
        // Only stop listening once sound actually started. A gesture that
        // still gets refused leaves the listeners armed for the next one.
        if (ok) disarmRef.current?.();
      });
    };

    const disarm = () => {
      events.forEach((event) => document.removeEventListener(event, onFirstInteraction));
      disarmRef.current = null;
    };
    disarmRef.current = disarm;
    events.forEach((event) =>
      document.addEventListener(event, onFirstInteraction, { passive: true })
    );
  }, [tryPlayWithSound]);

  /** Ref callback for the <video>. Runs the autoplay ladder on attach. */
  const attachVideo = useCallback(
    (video: HTMLVideoElement | null) => {
      // VideoSlot swaps `src` on breakpoint crossings rather than
      // remounting, but a remount is still possible — drop the previous
      // element's listener before adopting a new one so repeated attaches
      // cannot stack duplicates.
      detachSyncRef.current?.();
      videoRef.current = video;
      if (!video) {
        disarmRef.current?.();
        return;
      }

      // Keep React state honest about the element's real mute state —
      // covers the browser muting it back, and any path that changes
      // `muted` outside this hook.
      const syncFromElement = () => setUnmuted(!video.muted);
      video.addEventListener("volumechange", syncFromElement);
      detachSyncRef.current = () => {
        video.removeEventListener("volumechange", syncFromElement);
        detachSyncRef.current = null;
      };

      if (!wantsSoundRef.current) {
        playMuted(video);
        return;
      }

      void tryPlayWithSound(video).then((ok) => {
        if (!ok) armFirstInteraction();
      });
    },
    [armFirstInteraction, playMuted, tryPlayWithSound]
  );

  /** The visible control: mute if audible, request sound if muted. */
  const toggleSound = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!video.muted) {
      wantsSoundRef.current = false;
      writePreference(false);
      disarmRef.current?.();
      playMuted(video);
      return;
    }

    wantsSoundRef.current = true;
    writePreference(true);
    void tryPlayWithSound(video).then((ok) => {
      // A click IS a trusted gesture, so this branch is rare — it means
      // the browser refuses audio for this origin entirely. Stay armed so
      // a later interaction can still succeed.
      if (!ok) armFirstInteraction();
    });
  }, [armFirstInteraction, playMuted, tryPlayWithSound]);

  useEffect(
    () => () => {
      disarmRef.current?.();
      detachSyncRef.current?.();
    },
    []
  );

  return { attachVideo, unmuted, toggleSound };
}
