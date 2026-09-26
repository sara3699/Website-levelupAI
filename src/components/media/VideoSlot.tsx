"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useInView } from "framer-motion";
import clsx from "clsx";

// Matches the layout breakpoint the rest of the site treats as "desktop"
// (e.g. the hero device grid, .hero-device-phone repositioning).
const MOBILE_QUERY = "(max-width: 980px)";

type VideoSlotProps = {
  src?: string;
  /** Alternate clip for narrow/mobile viewports (<= 980px). When provided,
   * the element swaps `src` on breakpoint crossings instead of always
   * playing `src`. */
  mobileSrc?: string;
  poster?: string;
  fallback: ReactNode;
  overlay?: ReactNode;
  loop?: boolean;
  priority?: boolean;
  objectPosition?: string;
  className?: string;
  /** Video starts muted (required for autoplay in every browser); pass
   * `true` once a sibling "play with sound" control (rendered outside this
   * component — see useUnmutableVideo) has unmuted it. */
  unmuted?: boolean;
  /** Ref target for the rendered <video> — shared with whatever owns the
   * unmute control via useUnmutableVideo. */
  videoRef?: React.Ref<HTMLVideoElement>;
  /** Called with the mounted <video> element (or null on unmount) — lets a
   * consumer attach a WebGL effect (e.g. VideoRipple) to the real element. */
  onVideoElement?: (video: HTMLVideoElement | null) => void;
};

/**
 * Video-ready background primitive. With no `src`, renders only the styled
 * fallback. Once a Flora-generated clip exists, pass `src` and it layers in
 * with zero layout changes — the fallback stays mounted underneath.
 *
 * The video only mounts after a client-side effect confirms it should (in
 * view / reduced-motion), so SSR and the first client paint always agree
 * (neither ever renders a <video>) — avoiding a hydration mismatch that a
 * client-only prefers-reduced-motion check would otherwise cause.
 */
export default function VideoSlot({
  src,
  mobileSrc,
  poster,
  fallback,
  overlay,
  loop = true,
  priority = false,
  objectPosition = "center",
  className,
  unmuted = false,
  videoRef: externalVideoRef,
  onVideoElement,
}: VideoSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(containerRef, { once: true, margin: "200px" });
  const [shouldMount, setShouldMount] = useState(false);
  // Starts as `src` on both server and first client paint (avoids a
  // hydration mismatch); a client-only effect below corrects it to
  // `mobileSrc` if the viewport is already narrow.
  const [activeSrc, setActiveSrc] = useState(src);

  useEffect(() => {
    if (!src) return;
    if (!(priority || isInView)) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    const frame = requestAnimationFrame(() => setShouldMount(true));
    return () => cancelAnimationFrame(frame);
  }, [src, priority, isInView]);

  useEffect(() => {
    if (!mobileSrc) return;
    const query = window.matchMedia(MOBILE_QUERY);
    const sync = () => setActiveSrc(query.matches ? mobileSrc : src);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [src, mobileSrc]);

  function setVideoRef(video: HTMLVideoElement | null) {
    if (typeof externalVideoRef === "function") externalVideoRef(video);
    else if (externalVideoRef && "current" in externalVideoRef) {
      (externalVideoRef as React.RefObject<HTMLVideoElement | null>).current = video;
    }
    onVideoElement?.(video);
  }

  return (
    <div ref={containerRef} className={clsx("video-slot", className)}>
      <div className="video-slot-fallback" aria-hidden="true">
        {fallback}
      </div>
      {shouldMount && (
        <video
          ref={setVideoRef}
          className="video-slot-video"
          src={activeSrc}
          poster={poster}
          autoPlay
          muted={!unmuted}
          playsInline
          loop={loop}
          preload={priority ? "auto" : "metadata"}
          style={{ objectPosition }}
        />
      )}
      {overlay && (
        <div className="video-slot-overlay" aria-hidden="true">
          {overlay}
        </div>
      )}
    </div>
  );
}
