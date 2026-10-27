import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { contentTokens, termMatches } from "../core/normalize";
import { CONTACT_EMAIL } from "../knowledge";
import type { LocalModel } from "./model";

/**
 * Extraits que le modèle local peut citer, construits depuis les
 * dictionnaires du site — exactement ce que la page affiche, rien d'autre.
 * Changez un texte dans fr.json : l'assistant le suit au redémarrage.
 *
 * La recherche combine les mots (tolérants aux fautes, comme le routeur) et,
 * si le modèle d'embeddings est disponible, la proximité de sens.
 */

export type Chunk = { id: string; title: string; text: string };

const clean = (s: string) => s.replace(/\s+/g, " ").trim();
const cache = new Map<Locale, Chunk[]>();

export function siteChunks(locale: Locale): Chunk[] {
  const hit = cache.get(locale);
  if (hit) return hit;
  const d = getDictionary(locale);
  const fr = locale === "fr";
  const out: Chunk[] = [];
  const add = (id: string, title: string, text: string) => {
    const t = clean(text);
    if (t) out.push({ id: `${locale}:${id}`, title: clean(title), text: t });
  };

  add("about", fr ? "À propos de Level Up AI" : "About Level Up AI",
    [d.meta.description, d.hero.copy, d.hero.proof.join(". "), d.work.lead, d.pricing.lead].join(" "));
  add("team", `${d.about.title} — ${fr ? "fondatrices et équipe derrière Level Up AI" : "founders and team behind Level Up AI"}`,
    d.about.people.map((p) => `${p.name}, ${p.role} : ${p.bio[0] ?? ""}`).join(" "));
  const ads = Object.values(d.commercials.clips).map((c) => c.label).filter((l) => !/macro/i.test(l));
  add("sectors", fr ? "Secteurs et exemples de réalisations" : "Sectors and sample work",
    `${d.hero.proof[0] ?? ""}. ${fr ? "Exemples de secteurs" : "Sample sectors"} : ${Object.values(d.carousel.labels).join(", ")}. ` +
    `${fr ? "Exemples de publicités IA réalisées" : "Sample AI commercials produced"} : ${ads.join(", ")}. ${d.carousel.lead}`);
  for (const [i, p] of d.services.packs.entries()) {
    add(`pack-${i}`, p.title, `${p.title}${p.number ? ` (${p.number})` : ""} : ${p.price}. ${p.copy} ${p.list.length ? `${fr ? "Comprend" : "Includes"} : ${p.list.join(" ; ")}.` : ""} ${p.summary}`);
  }
  add("subscriptions", d.pricing.subscriptionsTitle,
    d.pricing.subscriptions.map((s) => `${s.name} : ${s.content} ${s.price}`).join(" | "));
  for (const [i, s] of d.pricing.aiServices.entries()) add(`service-${i}`, s.title, s.copy);
  for (const [i, f] of d.fit.items.entries()) add(`approach-${i}`, f.title, f.copy);
  add("process", d.process.title, `${d.process.lead} ${d.process.steps.map((s, i) => `${i + 1}. ${s.title} : ${s.copy}`).join(" ")}`);
  for (const [i, q] of d.faq.items.entries()) add(`faq-${i}`, q.question, q.answer);
  add("contact", d.contact.title,
    `${d.contact.copy} ${fr ? "E-mail" : "Email"} : ${CONTACT_EMAIL}. ${d.contact.cardTitle} ${d.contact.points.map((p) => `${p.title} (${p.copy})`).join(", ")}`);
  add("order", fr ? "Commander" : "Ordering", d.chat.buddy.orderHelp);

  cache.set(locale, out);
  return out;
}

/* ------------------------------------------------------------ recherche */

const vectors = new Map<string, number[]>();
let embedding: Promise<void> | null = null;
const keyOf = (c: Chunk) => `${c.id}#${c.text.length}:${c.text.slice(0, 40)}`;

/** Calcule en arrière-plan les vecteurs manquants ; la recherche par mots sert en attendant. */
export function warmEmbeddings(model: LocalModel, chunks: Chunk[]): Promise<void> {
  const missing = chunks.filter((c) => !vectors.has(keyOf(c)));
  if (embedding) return embedding;
  if (missing.length === 0) return Promise.resolve();
  embedding = model
    .embed(missing.map((c) => `${c.title}. ${c.text}`), 120_000)
    .then((vecs) => { vecs?.forEach((v, i) => vectors.set(keyOf(missing[i]!), v)); })
    .catch((e) => console.error("[buddy-ai] embeddings indisponibles:", e instanceof Error ? e.message : e))
    .finally(() => { embedding = null; });
  return embedding;
}

function cosine(a: number[], b: number[]): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length && i < b.length; i++) { dot += a[i]! * b[i]!; na += a[i]! ** 2; nb += b[i]! ** 2; }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

function lexicalScores(question: string, chunks: Chunk[]): number[] {
  const q = [...new Set(contentTokens(question))];
  const docs = chunks.map((c) => new Set(contentTokens(`${c.title} ${c.text}`)));
  const hit = (doc: Set<string>, t: string) => [...doc].some((w) => termMatches(w, t) || termMatches(t, w));
  const df = new Map(q.map((t) => [t, docs.filter((d) => hit(d, t)).length]));
  return docs.map((doc) => q.reduce((s, t) => (hit(doc, t) ? s + Math.log(1 + chunks.length / (1 + df.get(t)!)) : s), 0));
}

/** Les extraits les plus proches de la question, meilleurs d'abord. */
export async function retrieve(question: string, chunks: Chunk[], k: number, model?: LocalModel | null): Promise<Chunk[]> {
  if (chunks.length === 0) return [];
  const lexical = lexicalScores(question, chunks);
  const maxLex = Math.max(...lexical, 1e-9);
  let semantic: number[] | null = null;
  if (model && chunks.every((c) => vectors.has(keyOf(c)))) {
    const q = await model.embed([question], 5_000).catch(() => null);
    if (q?.[0]) semantic = chunks.map((c) => cosine(q[0]!, vectors.get(keyOf(c))!));
  } else if (model) {
    void warmEmbeddings(model, chunks);
  }
  const scored = chunks.map((c, i) => ({ c, s: semantic ? semantic[i]! + 0.25 * (lexical[i]! / maxLex) : lexical[i]! }));
  const floor = semantic ? 0.35 : 0.5;
  return scored.filter((x) => x.s >= floor).sort((a, b) => b.s - a.s).slice(0, k).map((x) => x.c);
}
