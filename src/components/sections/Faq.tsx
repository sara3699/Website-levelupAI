"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import clsx from "clsx";
import Reveal from "@/components/ui/Reveal";
import { useTranslations } from "@/i18n/LocaleProvider";


export default function Faq() {
  const t = useTranslations();
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section className="section" id="faq">
      <div className="wrap faq-layout">
        <Reveal>
          <span className="section-kicker">{t.faq.kicker}</span>
          <h2>{t.faq.title}</h2>
          <p className="section-lead" style={{ marginTop: 25 }}>
            {t.faq.lead}
          </p>
        </Reveal>

        <Reveal className="faq-list glass" delay={0.1}>
          {t.faq.items.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={item.question} className={clsx("faq-item", isOpen && "open")}>
                <button
                  className="faq-question"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? -1 : index)}
                >
                  <span>{item.question}</span>
                  <span className="faq-plus">{isOpen ? "−" : "+"}</span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      className="faq-answer"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                    >
                      <p>{item.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
