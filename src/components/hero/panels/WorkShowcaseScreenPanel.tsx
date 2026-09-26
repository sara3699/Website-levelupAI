"use client";

/**
 * Third preview panel: a compact "see it in action" glimpse, echoing the
 * real WorkShowcase section's three showcase tags at laptop scale.
 */
import { useTranslations } from "@/i18n/LocaleProvider";

export default function WorkShowcaseScreenPanel() {
  const t = useTranslations();
  return (
    <div className="screen-panel">
      <span className="screen-panel-kicker">{t.screens.work.kicker}</span>
      <h2 className="screen-panel-title">{t.screens.work.title}</h2>
      <div className="screen-panel-tags">
        {t.screens.work.tags.map((tag) => (
          <span className="screen-panel-tag" key={tag}>{tag}</span>
        ))}
      </div>
    </div>
  );
}
