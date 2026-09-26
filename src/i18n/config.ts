export const LOCALES = ["en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  en: "EN",
  fr: "FR",
};

/** Cookie holding an explicit user choice. Beats geo detection on every
 *  later request — a visitor who picked a language meant it, and being
 *  re-detected back to the other one on the next page load is worse than
 *  never detecting at all. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Countries served French by default. Broadly: France + its neighbours,
 *  the Maghreb (where the business actually sells — TND pricing), and
 *  francophone West/Central Africa.
 *
 *  Canada is deliberately absent: it is majority-anglophone, so mapping the
 *  whole country to French would misroute more visitors than it helps.
 *  Quebec users get English first and can switch — which is exactly what
 *  the switcher is for. */
const FRENCH_COUNTRIES = new Set([
  "FR", "BE", "CH", "LU", "MC", // Europe
  "TN", "MA", "DZ",             // Maghreb
  "SN", "CI", "CM", "ML", "BF", "NE", "TG", "BJ", "GA", "CD", "CG", "MG",
]);

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function localeFromCountry(country: string | null | undefined): Locale | null {
  if (!country) return null;
  return FRENCH_COUNTRIES.has(country.toUpperCase()) ? "fr" : "en";
}

/** Minimal Accept-Language parse: highest-q supported language wins.
 *  Used only when no geo header is present (local dev, non-Vercel hosts),
 *  so a full RFC-4647 matcher would be more machinery than this earns. */
export function localeFromAcceptLanguage(header: string | null | undefined): Locale | null {
  if (!header) return null;

  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return {
        tag: tag.trim().toLowerCase(),
        q: q ? Number.parseFloat(q.split("=")[1]) || 0 : 1,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return null;
}
