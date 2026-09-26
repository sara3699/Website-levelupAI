import { getDictionary } from "@/i18n/dictionaries";
import { LOCALES, type Locale } from "@/i18n/config";
import { contentTokens, normalize } from "./core/normalize";

/**
 * Base de connaissances du chatbot, construite depuis les dictionnaires du
 * site. C'est la seule source : changez un prix ou un pack dans `fr.json`,
 * la réponse change avec — il n'existe aucune copie à maintenir, et le bot
 * ne peut rien dire que la page n'affiche pas déjà.
 */

export const CONTACT_EMAIL = "hello@levelupai.studio";

export type PackRecord = {
  kind: "pack";
  index: number;
  number: string;
  title: string;
  price: string;
  copy: string;
  includes: string[];
  summary: string;
};
export type SubscriptionRecord = { kind: "subscription"; index: number; name: string; price: string; content: string };
export type ServiceRecord = { kind: "service"; title: string; copy: string };
export type ProcessRecord = { kind: "process"; step: number; title: string; copy: string };
export type FaqRecord = { kind: "faq"; index: number; question: string; answer: string };

export type Knowledge = {
  locale: Locale;
  packs: PackRecord[];
  subscriptions: SubscriptionRecord[];
  services: ServiceRecord[];
  process: ProcessRecord[];
  faq: FaqRecord[];
  contact: { email: string; copy: string };
};

const cache = new Map<Locale, Knowledge>();

export function buildKnowledge(locale: Locale): Knowledge {
  const hit = cache.get(locale);
  if (hit) return hit;

  const t = getDictionary(locale);
  const knowledge: Knowledge = {
    locale,
    packs: t.services.packs.map((p, index) => ({
      kind: "pack",
      index,
      number: p.number,
      title: p.title,
      price: p.price,
      copy: p.copy,
      includes: p.list,
      summary: p.summary,
    })),
    subscriptions: t.pricing.subscriptions.map((s, index) => ({
      kind: "subscription",
      index,
      name: s.name,
      price: s.price,
      content: s.content,
    })),
    services: t.pricing.aiServices.map((s) => ({ kind: "service", title: s.title, copy: s.copy })),
    process: t.process.steps.map((s, i) => ({ kind: "process", step: i + 1, title: s.title, copy: s.copy })),
    faq: t.faq.items.map((f, index) => ({ kind: "faq", index, question: f.question, answer: f.answer })),
    contact: { email: CONTACT_EMAIL, copy: t.contact.copy },
  };
  cache.set(locale, knowledge);
  return knowledge;
}

/* ------------------------------------------------------------ alias */

/** Mots qui ne distinguent pas un pack d'un autre. */
const GENERIC = new Set(["pack", "packs", "package", "packages", "offre", "offer"]);

/**
 * Termes qui désignent un pack, toutes langues confondues.
 *
 * Un visiteur du site français peut écrire « growth pack » : les alias sont
 * donc pris dans chaque dictionnaire, à index égal, pour que le même pack
 * soit reconnu quel que soit le mot employé.
 */
export function packAliases(index: number): { phrases: string[]; strong: string[] } {
  const phrases = new Set<string>();
  const strong = new Set<string>();
  for (const locale of LOCALES) {
    const pack = getDictionary(locale).services.packs[index];
    if (!pack) continue;
    const words = contentTokens(pack.title).filter((w) => !GENERIC.has(w));
    if (words.length > 0) phrases.add(words.join(" "));
    // « PACK 01 » → « 01 » : le numéro seul suffit à désigner l'offre.
    const digits = normalize(pack.number).match(/\d+/)?.[0];
    if (digits) phrases.add(digits);
  }
  return { phrases: [...phrases], strong: [...strong] };
}

/** Mots porteurs des questions de la FAQ, toutes langues confondues. */
export function faqTerms(index: number): string[] {
  const terms = new Set<string>();
  for (const locale of LOCALES) {
    const item = getDictionary(locale).faq.items[index];
    if (item) for (const w of contentTokens(item.question)) terms.add(w);
  }
  return [...terms];
}

/** Noms des abonnements, toutes langues confondues. */
export function subscriptionTerms(): string[] {
  const terms = new Set<string>();
  for (const locale of LOCALES) {
    for (const s of getDictionary(locale).pricing.subscriptions) {
      for (const w of contentTokens(s.name)) terms.add(w);
    }
  }
  return [...terms];
}
