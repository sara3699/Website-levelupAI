"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

type ProcessCursorVideoProps = {
  src: string;
  label: string;
  containerRef: React.RefObject<HTMLElement | null>;
};

/**
 * Replaces the system cursor, while hovering `containerRef`, with a small
 * looping video puck that tracks the pointer — the video literally *is*
 * the cursor, not a background layer behind a card. Position tracking uses
 * the same gsap.quickTo smoothing as CustomCursor's dot/ring so it feels
 * consistent with the site's existing cursor behavior.
 *
 * This component mounts once for the whole section and stays mounted as
 * `src`/`label` change across steps — it must NOT be remounted (e.g. via a
 * changing `key` on the caller) on every step change, since ProcessTimeline
 * scrubs steps continuously while the pointer sits still inside the
 * section: a remount would tear down the pointerenter/pointermove
 * listeners and reset `inside` to false, and because the browser only
 * fires `pointerenter` when the pointer newly crosses into an element (not
 * on every move), the puck would never become visible again once the
 * pointer stopped moving.
 *
 * Desktop-only (pointer:fine gated) and skipped under reduced-motion, same
 * as every other cursor-driven effect in this codebase.
 */
export default function ProcessCursorVideo({ src, label, containerRef }: ProcessCursorVideoProps) {
  const puckRef = useRef<HTMLDivElement>(null);
  const [inside, setInside] = useState(false);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const container = containerRef.current;
    if (!finePointer || reducedMotion || !container) return;

    const puck = puckRef.current;
    if (!puck) return;

    const xTo = gsap.quickTo(puck, "x", { duration: 0.35, ease: "power3.out" });
    const yTo = gsap.quickTo(puck, "y", { duration: 0.35, ease: "power3.out" });

    const onMove = (e: PointerEvent) => {
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const onEnter = (e: PointerEvent) => {
      setInside(true);
      document.body.classList.add("process-cursor-hover");
      xTo(e.clientX);
      yTo(e.clientY);
    };
    const onLeave = () => {
      setInside(false);
      document.body.classList.remove("process-cursor-hover");
    };

    container.addEventListener("pointermove", onMove);
    container.addEventListener("pointerenter", onEnter);
    container.addEventListener("pointerleave", onLeave);
    return () => {
      container.removeEventListener("pointermove", onMove);
      container.removeEventListener("pointerenter", onEnter);
      container.removeEventListener("pointerleave", onLeave);
      document.body.classList.remove("process-cursor-hover");
    };
    // containerRef.current is a ref to a DOM node that itself never changes
    // for the lifetime of this component (ProcessTimeline renders one fixed
    // section element), so this effect intentionally runs once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div ref={puckRef} className={`process-cursor-video${inside ? " is-visible" : ""}`} aria-hidden="true">
      <div className="process-cursor-video-inner">
        <video
          key={src}
          className="process-cursor-video-el"
          src={src}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
        <span className="process-cursor-video-label">{label}</span>
      </div>
    </div>
  );
}
