import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";

export default async function Marquee({ lang }: { lang: string }) {
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);
  const ITEMS = t.marquee;

  return (
    <div className="marquee" aria-hidden="true">
      <div className="marquee-track">
        {[0, 1].map((row) => (
          <div className="marquee-item" key={row}>
            {ITEMS.map((item) => (
              <span key={item} className="marquee-pair">
                <span>{item}</span>
                <span className="marquee-star">✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
