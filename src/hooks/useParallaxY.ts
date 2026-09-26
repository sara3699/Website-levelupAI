"use client";

import { useRef } from "react";
import { useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";

export function useParallaxY(distance = 80): {
  ref: React.RefObject<HTMLDivElement | null>;
  y: MotionValue<number>;
} {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const rawY = useTransform(scrollYProgress, [0, 1], [distance, -distance]);
  const y = useSpring(rawY, { stiffness: 120, damping: 30, mass: 0.5 });

  return { ref, y };
}
