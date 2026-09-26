import Image from "next/image";
import { getDictionary, interpolate } from "@/i18n/dictionaries";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";

export default async function Footer({ lang }: { lang: string }) {
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);

  return (
    <footer>
      <div className="wrap footer-inner">
        {/* Same asset as the header (see SiteNav) rather than the older
            BRAND recolour, so the mark is identical top and bottom. The
            artwork is dark navy, so on the footer's dark ground it needs
            the same light plate the nav gives it: .footer-brand carries a
            slimmer version of that container, not a copy of the nav's. */}
        <div className="footer-brand">
          <Image
            className="brand-logo"
            src="/LEVEL_UP_AI.png"
            alt="LevelUp AI"
            width={1150}
            height={365}
          />
        </div>
        <div className="footer-meta">
          {t.footer.items.map((item) => (
            <span key={item}>{item}</span>
          ))}
          <span>{interpolate(t.footer.copyright, { year: new Date().getFullYear() })}</span>
        </div>
      </div>
    </footer>
  );
}
