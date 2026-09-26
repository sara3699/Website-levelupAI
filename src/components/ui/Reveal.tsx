"use client";

import { type ReactNode } from "react";
import { motion, type Variants } from "framer-motion";
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
};

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

export default function Reveal({ children, as = "div", className, delay = 0, y = 28, id }: RevealProps) {
  const MotionTag = TAGS[as];
  const variants: Variants = {
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
