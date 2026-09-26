"use client";

import { type ElementType, type ReactNode, useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";

type RevealTextProps = {
  lines: ReactNode[];
  as?: ElementType;
  className?: string;
  delay?: number;
};

const container: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.11, delayChildren: 0 },
  },
};

const line: Variants = {
  hidden: { y: "100%", opacity: 0 },
  visible: {
    y: "0%",
    opacity: 1,
    transition: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
  },
};

/**
 * Staggered line-by-line reveal for display headlines — used above the
 * fold (the hero H1). SSR and the first client paint both render the
 * static "hidden" markup (`initial`, not yet animating); the transition to
 * "visible" is deferred to a post-mount effect. This guarantees the first
 * hydrated commit always matches SSR exactly, including under
 * `prefers-reduced-motion`, where Framer Motion can otherwise resolve the
 * animation to its end state synchronously and race React's hydration diff.
 */
export default function RevealText({ lines, as: Tag = "h1", className, delay = 0 }: RevealTextProps) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setAnimate(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <Tag className={className}>
      <motion.span
        style={{ display: "block" }}
        variants={container}
        initial="hidden"
        animate={animate ? "visible" : "hidden"}
        transition={{ delayChildren: delay }}
      >
        {lines.map((content, index) => (
          <span key={index} className="reveal-line-mask">
            <motion.span className="reveal-line-inner" variants={line}>
              {content}
            </motion.span>
          </span>
        ))}
      </motion.span>
    </Tag>
  );
}
