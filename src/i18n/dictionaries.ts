import en from "./dictionaries/en.json";
import fr from "./dictionaries/fr.json";
import type { Locale } from "./config";

/** English is the source of truth for the shape. Typing `fr` as Dictionary
 *  makes any missing or misspelled key in fr.json a compile error rather
 *  than a silently blank string on the page. */
export type Dictionary = typeof en;

const dictionaries: Record<Locale, Dictionary> = {
  en,
  fr: fr as Dictionary,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

/** Fills `{name}` placeholders — used by the few strings that interpolate a
 *  value, e.g. the "Play {title} with sound" aria-labels and the footer year. */
export function interpolate(template: string, values: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (match, key) =>
    key in values ? String(values[key]) : match
  );
}
