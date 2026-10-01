/**
 * Per-country display currency.
 *
 * IMPORTANT — this swaps the *unit only*, never the amount: a price written
 * "890 TND" is shown to a French visitor as "890 EUR", not as the converted
 * value (~260 EUR). That is a deliberate product decision, not an oversight.
 * If you later want real conversion, add a rate per currency below and
 * multiply in `localizePrice`; nothing else needs to change.
 */

export const CURRENCIES = ["TND", "EUR", "GBP", "USD", "CHF", "CAD", "MAD", "DZD"] as const;
export type Currency = (typeof CURRENCIES)[number];

export const DEFAULT_CURRENCY: Currency = "TND";

/** Cookie holding an explicit choice, mirroring how the locale is stored. */
export const CURRENCY_COOKIE = "PRICE_CURRENCY";
export const CURRENCY_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/** Country -> currency (Sarra, 2026-10-01): Europe in euros, Switzerland
 *  included, except the UK in pounds; Tunisia, Morocco and Algeria in their
 *  own currencies; every other country in dollars (see OTHER_COUNTRIES_CURRENCY),
 *  Canada, the Gulf and Asia included. Turkey and Russia count as "other". */
const COUNTRY_CURRENCY: Record<string, Currency> = {
  // Eurozone
  FR: "EUR", BE: "EUR", DE: "EUR", ES: "EUR", IT: "EUR", NL: "EUR",
  PT: "EUR", IE: "EUR", AT: "EUR", LU: "EUR", FI: "EUR", GR: "EUR",
  SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", CY: "EUR",
  MT: "EUR", HR: "EUR", MC: "EUR",
  // Rest of Europe, also shown in euros
  CH: "EUR", PL: "EUR", SE: "EUR", DK: "EUR", CZ: "EUR",
  HU: "EUR", RO: "EUR", BG: "EUR", NO: "EUR", IS: "EUR", LI: "EUR",
  AD: "EUR", SM: "EUR", VA: "EUR", AL: "EUR", BA: "EUR", ME: "EUR",
  MK: "EUR", RS: "EUR", XK: "EUR", MD: "EUR", UA: "EUR",
  // The UK keeps pounds
  GB: "GBP",
  // Maghreb: each in its own currency
  MA: "MAD",
  DZ: "DZD",
  TN: "TND",
};

/** Any country not listed above: the USA, Canada, the Gulf, Asia… */
const OTHER_COUNTRIES_CURRENCY: Currency = "USD";

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function currencyFromCountry(country: string | null | undefined): Currency | null {
  if (!country) return null;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? OTHER_COUNTRIES_CURRENCY;
}

/**
 * Replaces the currency token inside an already-formatted price string.
 * Prices in the dictionaries are whole strings ("À partir de 890 TND",
 * "1 190 TND/mois") because their prefixes and suffixes are translated, so
 * this rewrites the unit in place rather than reformatting the number.
 */
export function localizePrice(price: string, currency: Currency): string {
  if (currency === DEFAULT_CURRENCY) return price;
  return price.replace(/\bTND\b/g, currency);
}

/** The display currency the proxy stored for this visitor, read in the
 *  browser (the cookie is not httpOnly). Falls back to the default. */
export function currencyFromDocumentCookie(): Currency {
  if (typeof document === "undefined") return DEFAULT_CURRENCY;
  const match = document.cookie.match(new RegExp(`(?:^|; )${CURRENCY_COOKIE}=([^;]*)`));
  const value = match ? decodeURIComponent(match[1]) : "";
  return isCurrency(value) ? value : DEFAULT_CURRENCY;
}
