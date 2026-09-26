"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { useTranslations } from "@/i18n/LocaleProvider";

export default function QuoteBox() {
  const t = useTranslations();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.9", "start 0.4"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [0.35, 1]);
  const blur = useTransform(scrollYProgress, [0, 1], [6, 0]);
  const filter = useTransform(blur, (value) => `blur(${value}px)`);

  return (
    <section className="quote-section section-wash-loop section-wash-loop-start">
      <div className="wrap" ref={ref}>
        <div className="quote-box glass glass-gold-border">
          <motion.blockquote style={{ opacity, filter }}>
            {t.quote.text}
          </motion.blockquote>
          <p>{t.quote.attribution}</p>
        </div>
      </div>
    </section>
  );
}
