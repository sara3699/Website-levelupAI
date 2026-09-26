import { contentTokens, normalize, termMatches } from "./core/normalize";
import { packAliases, type Knowledge, type PackRecord, type ServiceRecord, type SubscriptionRecord } from "./knowledge";

/**
 * Conseil par budget, par besoin, et comparaison de packs.
 *
 * Tout est calculé depuis les dictionnaires : un prix est lu dans la chaîne
 * affichée sur la page, un besoin est rapproché des lignes « comprend » de
 * chaque pack, une comparaison oppose deux listes. Rien n'est estimé ni
 * inventé — quand le site ne le dit pas, le bot ne le sait pas.
 */

/** « À partir de 890 TND », « 1 890 TND », « 1,890 TND » → 890, 1890, 1890. « Sur devis » → null. */
export function parsePrice(price: string): number | null {
  const m = price.replace(/[\s  ,]/g, "").match(/(\d{3,6})/);
  return m ? Number(m[1]) : null;
}

/** Un montant dans le message, avec sa devise ou un mot de budget. */
export function detectBudget(raw: string): number | null {
  const n = normalize(raw);
  const amount = "(\\d{1,3}(?: \\d{3})+|\\d{3,6})";
  const m =
    new RegExp(`\\b${amount}\\s*(?:tnd|dt|dinars?|euros?|eur)\\b`).exec(n) ??
    new RegExp(`\\b(?:budget|j ai|jai|i have|dispose de|maximum|max|jusqu a|up to|environ|around|about)\\s*(?:de|d|of|is|est|un|a)?\\s*${amount}\\b`).exec(n);
  if (!m?.[1]) return null;
  const value = Number(m[1].replace(/\s/g, ""));
  return value >= 100 && value <= 1_000_000 ? value : null;
}

export function withinBudget(k: Knowledge, budget: number) {
  const packs = k.packs
    .map((p) => ({ pack: p, price: parsePrice(p.price) }))
    .filter((x): x is { pack: PackRecord; price: number } => x.price !== null && x.price <= budget)
    .sort((a, b) => a.price - b.price);
  const subscriptions = k.subscriptions
    .map((s) => ({ sub: s, price: parsePrice(s.price) }))
    .filter((x): x is { sub: SubscriptionRecord; price: number } => x.price !== null && x.price <= budget)
    .sort((a, b) => a.price - b.price);
  const cheapest = Math.min(...k.packs.map((p) => parsePrice(p.price) ?? Infinity));
  return { packs, subscriptions, cheapest: Number.isFinite(cheapest) ? cheapest : null };
}

const NEED_TRIGGER = /\b(je veux|je voudrais|j aimerais|je cherche|j ai besoin|besoin|il me faut|me faut|i want|i need|i m looking|looking for|i d like|would like|nheb|n7eb|lezemni)\b/;
const NOISE = new Set([
  "veux", "voudrais", "aimerais", "cherche", "besoin", "faut", "want", "need", "looking", "like", "would",
  "nheb", "n7eb", "lezemni", "pack", "packs", "package", "offre", "offres", "offer", "prix", "price", "tarif",
  "budget", "tnd", "quelque", "chose", "something", "avoir", "faire", "make", "get", "have", "pour", "with",
  // Les verbes d'achat ne décrivent pas un besoin : « nheb nechri » = « je veux acheter ».
  "nechri", "commandi", "commander", "acheter", "achete", "buy", "order", "purchase", "souscrire", "subscribe",
]);

export type NeedMatch = {
  need: string;
  packs: { pack: PackRecord; line: string }[];
  services: ServiceRecord[];
};

/** « je veux des vidéos » → les packs et services qui mentionnent des vidéos. */
export function detectNeed(raw: string, k: Knowledge): NeedMatch | null {
  const n = normalize(raw);
  if (!NEED_TRIGGER.test(n)) return null;
  const needTokens = contentTokens(raw).filter((t) => !NOISE.has(t));
  if (needTokens.length === 0) return null;

  const hit = (text: string) => contentTokens(text).some((w) => needTokens.some((t) => termMatches(w, t) || termMatches(t, w)));
  const packs: NeedMatch["packs"] = [];
  for (const pack of k.packs) {
    const line = [...pack.includes, pack.summary].find(hit);
    if (line) packs.push({ pack, line });
  }
  const services = k.services.filter((s) => hit(`${s.title} ${s.copy}`));
  return { need: needTokens.join(" "), packs, services };
}

/** Deux packs nommés dans le message → comparaison. */
export function detectCompare(raw: string, k: Knowledge): PackRecord[] | null {
  const n = ` ${normalize(raw)} `;
  const mentioned = k.packs.filter((p) =>
    packAliases(p.index).phrases.some((alias) => /\D/.test(alias) && n.includes(` ${alias} `)),
  );
  return mentioned.length >= 2 ? mentioned.slice(0, 2) : null;
}

/** Ce que chaque pack a en plus de l'autre, et ce qu'ils partagent. */
export function diffPacks(a: PackRecord, b: PackRecord) {
  const key = (s: string) => normalize(s);
  const inA = new Set(a.includes.map(key));
  const inB = new Set(b.includes.map(key));
  return {
    common: a.includes.filter((l) => inB.has(key(l))),
    onlyA: a.includes.filter((l) => !inB.has(key(l))),
    onlyB: b.includes.filter((l) => !inA.has(key(l))),
  };
}
