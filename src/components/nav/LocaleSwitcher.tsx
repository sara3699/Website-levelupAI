"use client";

import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import {
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_LABELS,
  type Locale,
} from "@/i18n/config";
import { useLocale } from "@/i18n/LocaleProvider";

export default function LocaleSwitcher({ onSwitch }: { onSwitch?: () => void }) {
  const { locale, dict } = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  function switchTo(next: Locale) {
    if (next === locale) return;

    // Persist the choice so the proxy stops re-detecting from geo on later
    // visits — an explicit pick must outlive this page view.
    // eslint-disable-next-line react-hooks/immutability -- event handler, not render
    document.cookie = `${LOCALE_COOKIE}=${next};path=/;max-age=${LOCALE_COOKIE_MAX_AGE};samesite=lax`;

    // Swap just the locale segment, keeping any deeper path intact.
    const rest = pathname.replace(/^\/[^/]+/, "");
    onSwitch?.();
    router.push(`/${next}${rest}`);
    router.refresh();
  }

  return (
    <div className="locale-switcher" role="group" aria-label={dict.nav.languageLabel}>
      {LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          className={clsx("locale-option", option === locale && "locale-option-active")}
          aria-current={option === locale}
          onClick={() => switchTo(option)}
        >
          {LOCALE_LABELS[option]}
        </button>
      ))}
    </div>
  );
}
