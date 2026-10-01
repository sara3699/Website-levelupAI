"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";
import clsx from "clsx";

const TAGS = {
  div: motion.div,
  article: motion.article,
  aside: motion.aside,
} as const;

type RevealProps = {
  children: ReactNode;
  as?: keyof typeof TAGS;
  className?: string;
  delay?: number;
  y?: number;
  id?: string;
  /** "fly": a bigger entrance (rise from lower, tilted back, small bounce),
   *  used by the pack cards. Plain fade for visitors who reduce motion. */
  variant?: "rise" | "fly";
};

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
/** Overshoots slightly past 1, which is the small bounce on landing. */
const EASE_BOUNCE: [number, number, number, number] = [0.2, 0.9, 0.3, 1.25];

export default function Reveal({ children, as = "div", className, delay = 0, y = 28, id, variant = "rise" }: RevealProps) {
  const MotionTag = TAGS[as];
  const reduceMotion = useReducedMotion();
  const variants: Variants =
    variant === "fly"
      ? reduceMotion
        ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.5, delay } } }
        : {
            hidden: { opacity: 0, y: 70, rotateX: 18, scale: 0.94 },
            visible: { opacity: 1, y: 0, rotateX: 0, scale: 1, transition: { duration: 0.9, ease: EASE_BOUNCE, delay } },
          }
      : {
          hidden: { opacity: 0, y },
          visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: EASE_OUT, delay } },
        };

  return (
    <MotionTag
      id={id}
      className={clsx(className)}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={variants}
    >
      {children}
    </MotionTag>
  );
}
