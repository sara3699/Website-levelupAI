"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/**
 * A dot + trailing ring that follows the cursor, replacing the system
 * pointer's visual weight with something that feels tied to the site.
 * Desktop only (gated inside the effect via pointer:fine) — never rendered
 * differently between server and first client paint, since the markup
 * shape never changes, only whether the effect attaches listeners.
 */
export default function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer) return;

    const dot = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const xDot = gsap.quickTo(dot, "x", { duration: 0.08, ease: "power2.out" });
    const yDot = gsap.quickTo(dot, "y", { duration: 0.08, ease: "power2.out" });
    const xRing = gsap.quickTo(ring, "x", { duration: 0.45, ease: "power3.out" });
    const yRing = gsap.quickTo(ring, "y", { duration: 0.45, ease: "power3.out" });

    const move = (e: MouseEvent) => {
      xDot(e.clientX);
      yDot(e.clientY);
      xRing(e.clientX);
      yRing(e.clientY);
    };

    const over = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target?.closest("a, button, [data-cursor]")) ring.classList.add("hovering");
      else ring.classList.remove("hovering");
    };

    window.addEventListener("mousemove", move);
    window.addEventListener("mouseover", over);
    return () => {
      window.removeEventListener("mousemove", move);
      window.removeEventListener("mouseover", over);
    };
  }, []);

  return (
    <>
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
