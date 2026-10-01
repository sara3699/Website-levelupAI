"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/** A nav target and the run of page sections it stands for: from the top of
 *  `from` to the bottom of `to` (or of `from` alone). */
export type SectionRange = { href: string; from: string; to?: string };

/** How far down the viewport the "you are here" line sits. */
const LINE = 0.4;
/** Quiet time after the last scroll event before a click's lock is released. */
const SETTLE_MS = 180;
/** Release a click's lock anyway if the page never scrolls (already there). */
const MAX_LOCK_MS = 1200;

/**
 * Which nav target the reader is on: the range that covers a line 40% down
 * the viewport, or null (hero, quote band, footer).
 *
 * With `followScroll: false` only clicks change the active item: it stays
 * on the last item clicked, whatever the scroll position.
 *
 * `select(href)` marks a clicked item active straight away and holds it until
 * the smooth scroll the click started has settled, so the highlight does not
 * flicker through every section the page passes on the way down. Once the
 * page is still, the scroll position takes over again.
 */
export function useActiveSection(ranges: readonly SectionRange[], { followScroll = true } = {}) {
  const [active, setActive] = useState<string | null>(null);
  const lock = useRef<string | null>(null);
  const timer = useRef(0);

  const measure = useCallback((): string | null => {
    const line = window.innerHeight * LINE;
    for (const range of ranges) {
      const first = document.getElementById(range.from);
      const last = range.to ? document.getElementById(range.to) : first;
      if (!first || !last) continue;
      if (first.getBoundingClientRect().top <= line && last.getBoundingClientRect().bottom > line) {
        return range.href;
      }
    }
    return null;
  }, [ranges]);

  const release = useCallback(() => {
    // Where the page landed decides; if that reads as "no section" (e.g. the
    // very bottom of the page), the clicked item keeps its highlight.
    const landed = measure();
    setActive(landed ?? lock.current);
    lock.current = null;
  }, [measure]);

  useEffect(() => {
    if (!followScroll) return;
    // Scroll events already arrive at most once per frame, and measuring is
    // five getBoundingClientRect calls, so this runs directly rather than
    // through requestAnimationFrame (which also stalls in hidden tabs).
    // React skips the render when the active item has not changed.
    const update = () => {
      if (!lock.current) setActive(measure());
    };
    const onScroll = () => {
      if (lock.current) {
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(release, SETTLE_MS);
        return;
      }
      update();
    };
    const first = window.setTimeout(update, 0);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.clearTimeout(first);
      window.clearTimeout(timer.current);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [measure, release, followScroll]);

  const select = useCallback(
    (href: string) => {
      if (!followScroll) {
        setActive(href);
        return;
      }
      lock.current = href;
      setActive(href);
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(release, MAX_LOCK_MS);
    },
    [release, followScroll]
  );

  return [active, select] as const;
}
