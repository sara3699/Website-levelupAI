import type { IntentDef } from "./core/router";
import { buildKnowledge, faqTerms, packAliases, subscriptionTerms } from "./knowledge";
import type { Locale } from "@/i18n/config";

/**
 * Les questions que le chatbot du site sait traiter — et rien d'autre.
 *
 * Chaque intention pointe vers une réponse construite depuis la base de
 * connaissances. Les termes sont donnés dans les deux langues du site : un
 * visiteur de la page française qui écrit en anglais est compris aussi.
 * Toute question hors de cette liste est refusée, jamais improvisée.
 */

export type StaticIntentId = "help" | "packs" | "subscriptions" | "services" | "process" | "contact" | "order";
export type VitrineIntentId = StaticIntentId | `pack:${number}` | `faq:${number}`;

export const STATIC_INTENTS: IntentDef<StaticIntentId>[] = [
  {
    id: "help",
    strong: ["aide", "help", "chnowa", "chnia", "chnoua"],
    phrases: [
      "que sais tu faire", "que peux tu faire", "que puis je demander", "quelles questions",
      "what can you do", "what can i ask", "how can you help",
    ],
  },
  {
    id: "packs",
    strong: [
      "pack", "packs", "package", "packages", "formule", "formules",
      "tarif", "tarifs", "prix", "price", "prices", "pricing",
      "cout", "coute", "cost", "costs", "combien", "9adech", "kadech", "9addech", "flous",
    ],
    keywords: ["offre", "offres", "offer", "offers", "budget", "site", "website"],
  },
  {
    id: "subscriptions",
    strong: ["abonnement", "abonnements", "subscription", "subscriptions", "mensuel", "mensuelle", "monthly"],
    keywords: ["mois", "month", "recurrent", "recurring", ...subscriptionTerms()],
  },
  {
    id: "services",
    strong: ["service", "services", "prestation", "prestations"],
    keywords: [
      "site", "web", "website", "shooting", "photo", "photos", "video", "videos",
      "chatbot", "automatisation", "automation", "seo", "logo", "identite", "branding",
      "marketing", "reseaux", "social",
    ],
    phrases: ["que faites vous", "vous faites quoi", "que proposez vous", "what do you do", "what services"],
  },
  {
    id: "process",
    strong: [
      "process", "processus", "deroulement", "etape", "etapes", "step", "steps",
      "delai", "delais", "timeline", "duree", "duration",
    ],
    keywords: ["temps", "time", "long", "jours", "days", "semaine", "semaines", "week", "weeks", "livraison", "delivery", "wa9tech", "waktech"],
    phrases: [
      "comment ca se passe", "comment ca marche", "comment vous travaillez",
      "how does it work", "how it works", "how do you work",
    ],
  },
  {
    id: "contact",
    strong: [
      "contact", "contacter", "joindre", "email", "mail", "telephone", "phone",
      "whatsapp", "devis", "quote", "appel", "call", "rendez",
    ],
    phrases: ["get in touch", "reach you", "vous joindre", "prendre contact", "parler a quelqu un", "talk to someone"],
  },
  {
    id: "order",
    strong: ["commander", "commande", "acheter", "achat", "order", "buy", "purchase", "panier", "cart", "checkout", "payer", "paiement", "payment", "nechri", "commandi"],
    keywords: ["souscrire", "subscribe", "commencer", "start", "demarrer"],
    phrases: [
      "comment commander", "how to order", "how do i order", "comment acheter", "how do i buy", "how to pay",
      "nheb nechri", "n7eb nechri", "acheter un pack", "commander un pack", "buy a pack", "order a pack",
    ],
  },
];

const cache = new Map<Locale, IntentDef<VitrineIntentId>[]>();

/**
 * Intentions complètes pour une langue : les fixes, plus une par pack et une
 * par question de FAQ, dérivées des dictionnaires.
 */
export function buildIntents(locale: Locale): IntentDef<VitrineIntentId>[] {
  const hit = cache.get(locale);
  if (hit) return hit;

  const k = buildKnowledge(locale);
  const intents: IntentDef<VitrineIntentId>[] = [...STATIC_INTENTS];

  // Un pack nommé l'emporte sur la liste des packs : l'expression vaut 3,
  // le mot « pack » seul vaut 2.
  for (const pack of k.packs) {
    const { phrases, strong } = packAliases(pack.index);
    intents.push({ id: `pack:${pack.index}`, phrases, strong });
  }

  // Une question de FAQ se reconnaît à deux de ses mots porteurs au moins :
  // un seul mot commun (« site », « entreprise ») serait trop fragile.
  for (const item of k.faq) {
    intents.push({ id: `faq:${item.index}`, keywords: faqTerms(item.index), minScore: 2 });
  }

  cache.set(locale, intents);
  return intents;
}
