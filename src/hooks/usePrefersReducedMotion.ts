"use client";

import { useEffect, useState } from "react";

/**
 * Always starts false so server and first client render agree — the real
 * OS preference is synced inside an effect, after hydration. Consumers must
 * only use this to gate what an effect does (start an animation, run a
 * timeline), never to decide what JSX renders on first paint.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = (event: MediaQueryListEvent) => setReduced(event.matches);
    const frame = requestAnimationFrame(() => setReduced(query.matches));
    query.addEventListener("change", onChange);
    return () => {
      cancelAnimationFrame(frame);
      query.removeEventListener("change", onChange);
    };
  }, []);

  return reduced;
}
