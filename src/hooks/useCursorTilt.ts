"use client";

import { useEffect, useRef } from "react";
import { useMotionValue, useSpring, type MotionValue } from "framer-motion";

type CursorTilt = {
  containerRef: React.RefObject<HTMLDivElement | null>;
  tiltX: MotionValue<number>;
  tiltY: MotionValue<number>;
};

/**
 * Tracks pointer position relative to a container's center, exposing
 * smoothed -1..1 values on tiltX/tiltY. Desktop fine-pointer only — on
 * touch devices there is no cursor, so the values stay at rest (0, 0) and
 * consumers should rely on their existing scroll-driven motion instead.
 */
export function useCursorTilt(): CursorTilt {
  const containerRef = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const tiltX = useSpring(rawX, { stiffness: 60, damping: 18, mass: 0.6 });
  const tiltY = useSpring(rawY, { stiffness: 60, damping: 18, mass: 0.6 });

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reducedMotion) return;

    const el = containerRef.current;
    if (!el) return;

    // Ignore pointer moves while a scroll is actively in progress, AND
    // stop any spring animation already in flight (jump() snaps the
    // MotionValue to its current value with zero residual velocity).
    // Blocking new input alone isn't enough: if the spring hadn't settled
    // to rest yet when the scroll started, it keeps ticking toward its old
    // target regardless, and every tick re-derives the several downstream
    // useTransform chains — exactly the frame budget GSAP's scroll-scrub
    // and the hero video shader are already competing for.
    let scrolling = false;
    let scrollEndTimer: number | undefined;
    const onScroll = () => {
      if (!scrolling) {
        tiltX.jump(tiltX.get());
        tiltY.jump(tiltY.get());
      }
      scrolling = true;
      window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(() => {
        scrolling = false;
      }, 150);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    function handlePointerMove(event: PointerEvent) {
      if (scrolling) return;
      const rect = el!.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width;
      const py = (event.clientY - rect.top) / rect.height;
      rawX.set(Math.min(1, Math.max(-1, (px - 0.5) * 2)));
      rawY.set(Math.min(1, Math.max(-1, (py - 0.5) * 2)));
    }

    function handlePointerLeave() {
      rawX.set(0);
      rawY.set(0);
    }

    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerleave", handlePointerLeave);
    return () => {
      window.clearTimeout(scrollEndTimer);
      window.removeEventListener("scroll", onScroll);
      el.removeEventListener("pointermove", handlePointerMove);
      el.removeEventListener("pointerleave", handlePointerLeave);
    };
  }, [rawX, rawY, tiltX, tiltY]);

  return { containerRef, tiltX, tiltY };
}
