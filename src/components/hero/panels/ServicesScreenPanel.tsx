"use client";

/**
 * Second preview panel: a compact "what we do" card row, echoing the real
 * Services section's three offerings at laptop scale. Distinct markup from
 * Services.tsx — no VideoSlot, no GlassCard, no Reveal — just three simple
 * cards, legible at a glance mid-pan.
 */

import { useTranslations } from "@/i18n/LocaleProvider";

export default function ServicesScreenPanel() {
  const t = useTranslations();
  return (
    <div className="screen-panel">
      <span className="screen-panel-kicker">{t.screens.services.kicker}</span>
      <h2 className="screen-panel-title">{t.screens.services.title}</h2>
      <div className="screen-panel-cards">
        {t.screens.services.items.map((service) => (
          <div className="screen-panel-card" key={service.label}>
            {/* The card's full service line. The panel is a fixed slice of the
                laptop screen and cannot grow, so the services live in the one
                title string rather than a sub-list: a list made the cards
                overflow the panel's bottom edge on phones. */}
            <strong>{service.label}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
