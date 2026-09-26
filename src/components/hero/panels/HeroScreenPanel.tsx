"use client";

/**
 * First preview panel: a compact mini-website mockup — "what a site we'd
 * build for you looks like." Plain static markup, no video/GSAP/Reveal —
 * cheap to render at laptop scale and legible even mid-pan.
 *
 * Pulled into the client bundle by DeviceMockup, so it reads translations
 * from context rather than loading a dictionary server-side.
 */
import { useTranslations } from "@/i18n/LocaleProvider";

export default function HeroScreenPanel() {
  const t = useTranslations();

  return (
    <div className="screen-panel">
      <div className="screen-mini-nav">
        <span className="screen-mini-logo">NORTH / STUDIO</span>
        <span className="screen-mini-links">
          {t.screens.hero.nav.map((item, i) => (
            <span key={item}>
              {i > 0 && "\u00a0\u00a0"}
              {item}
            </span>
          ))}
        </span>
      </div>
      <h2 className="screen-panel-title">{t.screens.hero.title}</h2>
      <p className="screen-panel-copy">{t.screens.hero.copy}</p>
      <span className="screen-mini-button">{t.screens.hero.button} →</span>
    </div>
  );
}
