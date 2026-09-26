"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import Reveal from "@/components/ui/Reveal";
import { useTranslations } from "@/i18n/LocaleProvider";


function FitItem({ item, order }: { item: { index: string; title: string; copy: string }; order: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.4"] });
  const fill = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  return (
    <Reveal as="div" className="fit-item" delay={order * 0.06}>
      <span className="fit-index" ref={ref}>
        <motion.span className="fit-index-fill" style={{ height: fill }} />
        <span className="fit-index-label">{item.index}</span>
      </span>
      <div>
        <h3>{item.title}</h3>
        <p>{item.copy}</p>
      </div>
    </Reveal>
  );
}

export default function FitList() {
  const t = useTranslations();
  // Index numerals are locale-neutral, so they're generated rather than
  // duplicated into every dictionary.
  const items = t.fit.items.map((item, i) => ({ ...item, index: String(i + 1).padStart(2, "0") }));

  return (
    <section className="section section-vivid section-vivid-fit">
      <div className="wrap fit-grid">
        <Reveal className="sticky-copy">
          <span className="section-kicker">{t.fit.kicker}</span>
          <h2>{t.fit.title}</h2>
          <p className="section-lead" style={{ marginTop: 25 }}>
            {t.fit.lead}
          </p>
        </Reveal>
        <div className="fit-list">
          {items.map((item, order) => (
            <FitItem key={item.index} item={item} order={order} />
          ))}
        </div>
      </div>
    </section>
  );
}
