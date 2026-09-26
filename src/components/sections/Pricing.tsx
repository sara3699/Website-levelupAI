import type { CSSProperties } from "react";

import GlassCard from "@/components/ui/GlassCard";
import Reveal from "@/components/ui/Reveal";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";

/* Tint cycles so no two cards sharing an edge in the 3-column grid repeat a
   color (row-to-row included). Visual only — titles/copy come from the
   dictionary and are joined to these by index. */
const SERVICE_TINTS = [
  { tint: "var(--tint-lavender)", deep: "var(--deep-lavender)" },
  { tint: "var(--tint-sky)", deep: "var(--deep-sky)" },
  { tint: "var(--tint-mint)", deep: "var(--deep-mint)" },
  { tint: "var(--tint-butter)", deep: "var(--deep-butter)" },
  { tint: "var(--tint-pink)", deep: "var(--deep-pink)" },
  { tint: "var(--tint-peach)", deep: "var(--deep-peach)" },
  { tint: "var(--tint-coral)", deep: "var(--deep-coral)" },
  { tint: "var(--tint-sand)", deep: "var(--deep-sand)" },
  { tint: "var(--tint-sky)", deep: "var(--deep-sky)" },
];

export default async function Pricing({ lang }: { lang: string }) {
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);
  const aiServices = t.pricing.aiServices.map((s, i) => ({ ...s, ...SERVICE_TINTS[i] }));

  return (
    <section className="section section-vivid section-vivid-pricing" id="pricing">
      <div className="wrap">
        <Reveal className="section-head">
          <div>
            <span className="section-kicker">{t.pricing.kicker}</span>
            <h2>{t.pricing.title}</h2>
          </div>
          <p className="section-lead">{t.pricing.lead}</p>
        </Reveal>

        {/* The nav's "Services" link targets this block: it's the full list of
            what we actually offer. The pack cards further up the page are
            bundles/pricing, so they own #packs instead. */}
        <Reveal className="pricing-block-head" id="services">
          <p>{t.pricing.servicesIntro}</p>
        </Reveal>
        <div className="pricing-services">
          {aiServices.map((service, index) => (
            <Reveal key={service.title} delay={index * 0.04}>
              <GlassCard
                className="pricing-service"
                style={{ "--tint": service.tint, "--deep": service.deep } as CSSProperties}
              >
                <h3>{service.title}</h3>
                <p>{service.copy}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>

        <Reveal className="pricing-cta">
          <a className="button" href="#contact">
            {t.pricing.cta}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </a>
        </Reveal>
      </div>
    </section>
  );
}
