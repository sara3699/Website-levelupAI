"use client";

import { useRef, useState, type ReactNode, type CSSProperties } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import clsx from "clsx";

type GlassCardProps = {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
  style?: CSSProperties;
};

/**
 * Glass panel with pointer-driven 3D tilt on desktop (fine pointers only).
 * On touch devices, tilt is driven by scroll position instead of pointer
 * position, since there is no cursor signal to follow.
 */
export default function GlassCard({ children, className, tilt = true, style }: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [hasFinePointer, setHasFinePointer] = useState(false);

  const rotateXRaw = useMotionValue(0);
  const rotateYRaw = useMotionValue(0);
  const rotateX = useSpring(rotateXRaw, { stiffness: 220, damping: 22 });
  const rotateY = useSpring(rotateYRaw, { stiffness: 220, damping: 22 });
  const glowX = useMotionValue(50);
  const glowY = useMotionValue(50);
  const background = useTransform(
    [glowX, glowY],
    ([gx, gy]: number[]) =>
      // Reads the palette's accent channel rather than a literal, so the
      // cursor glow tracks the theme instead of drifting off it.
      `radial-gradient(circle at ${gx}% ${gy}%, rgba(var(--accent-rgb), 0.16), transparent 60%)`
  );

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!tilt || event.pointerType !== "mouse") return;
    const el = ref.current;
    if (!el) return;
    if (!hasFinePointer) setHasFinePointer(true);
    const rect = el.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    rotateYRaw.set((px - 0.5) * 14);
    rotateXRaw.set((0.5 - py) * 14);
    glowX.set(px * 100);
    glowY.set(py * 100);
  }

  function handlePointerLeave() {
    rotateXRaw.set(0);
    rotateYRaw.set(0);
    glowX.set(50);
    glowY.set(50);
  }

  return (
    <motion.div
      ref={ref}
      className={clsx("glass", "glass-card", className)}
      style={{ ...style, rotateX, rotateY, transformPerspective: 900 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      {tilt && <motion.div className="glass-card-glow" style={{ background }} aria-hidden="true" />}
      <div className="glass-card-content">{children}</div>
    </motion.div>
  );
}
