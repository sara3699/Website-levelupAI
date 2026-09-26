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

/** Country -> currency. Only countries we actually want to differ from the
 *  TND default are listed; everything else falls through to it. */
const COUNTRY_CURRENCY: Record<string, Currency> = {
  // Eurozone
  FR: "EUR", BE: "EUR", DE: "EUR", ES: "EUR", IT: "EUR", NL: "EUR",
  PT: "EUR", IE: "EUR", AT: "EUR", LU: "EUR", FI: "EUR", GR: "EUR",
  SK: "EUR", SI: "EUR", EE: "EUR", LV: "EUR", LT: "EUR", CY: "EUR",
  MT: "EUR", HR: "EUR", MC: "EUR",
  // Non-euro Europe / North America
  GB: "GBP",
  CH: "CHF",
  US: "USD",
  CA: "CAD",
  // Maghreb neighbours
  MA: "MAD",
  DZ: "DZD",
  TN: "TND",
};

export function isCurrency(value: string): value is Currency {
  return (CURRENCIES as readonly string[]).includes(value);
}

export function currencyFromCountry(country: string | null | undefined): Currency | null {
  if (!country) return null;
  return COUNTRY_CURRENCY[country.toUpperCase()] ?? DEFAULT_CURRENCY;
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
