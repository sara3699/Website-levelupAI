import { getDictionary } from "@/i18n/dictionaries";
import type { Locale } from "@/i18n/config";
import { route } from "./core/router";
import { detectSmallTalk } from "./core/smalltalk";
import { bullets, numbered, paragraphs, truncate } from "./core/templates";
import { buildKnowledge, type Knowledge, type PackRecord } from "./knowledge";
import { buildIntents, type VitrineIntentId } from "./intents";
import { detectBudget, detectCompare, detectNeed, diffPacks, withinBudget } from "./recommend";

/**
 * Répond à un visiteur du site, sans modèle.
 *
 * Dans l'ordre : politesse, comparaison de deux packs, budget, besoin, puis
 * le routeur d'intentions. La réponse est toujours un gabarit rempli avec la
 * base de connaissances. Trois refus possibles — question hors sujet,
 * question ambiguë, détail absent — chacun avec des suggestions cliquables.
 */

export type BuddyReply = {
  reply: string;
  /** Questions proposées en puces sous la réponse. */
  suggestions?: string[];
};

const MAX_CHARS = 1500;
type BuddyDict = ReturnType<typeof getDictionary>["chat"]["buddy"];
const fill = (s: string, values: Record<string, string | number>) =>
  s.replace(/\{(\w+)\}/g, (m, key: string) => (key in values ? String(values[key]) : m));

export function answer(rawMessage: string, locale: Locale): BuddyReply {
  const t = getDictionary(locale).chat.buddy;
  const k = buildKnowledge(locale);
  const suggestions = t.suggestions.map((s) => s.question);
  const message = (rawMessage ?? "").slice(0, MAX_CHARS);

  const talk = detectSmallTalk(message);
  if (talk === "greeting") return { reply: t.greeting, suggestions };
  if (talk === "thanks") return { reply: t.thanks };
  if (talk === "bye") return { reply: t.bye };

  const compared = detectCompare(message, k);
  if (compared) return { reply: renderCompare(compared, t) };

  const budget = detectBudget(message);
  if (budget !== null) return renderBudget(budget, k, t);

  const need = detectNeed(message, k);
  if (need) return renderNeed(need, k, t, suggestions);

  const result = route(message, buildIntents(locale));
  if (result.kind === "none") {
    return { reply: t.unsupported, suggestions };
  }
  if (result.kind === "ambiguous") {
    const options = result.ids.map((id) => labelFor(id, k, t.labels)).join(` ${t.or} `);
    return {
      reply: t.ambiguous.replace("{options}", options),
      suggestions: result.ids.map((id) => questionFor(id, k, t.labels)),
    };
  }
  return render(result.id, k, t, suggestions);
}

/* ------------------------------------------------------------ conseil */

function renderBudget(budget: number, k: Knowledge, t: BuddyDict): BuddyReply {
  const { packs, subscriptions, cheapest } = withinBudget(k, budget);
  const subs = subscriptions.length
    ? paragraphs(t.budgetSubs, bullets(subscriptions.map(({ sub }) => `${sub.name} · ${sub.price} — ${sub.content}`)))
    : null;
  if (packs.length === 0) {
    return {
      reply: paragraphs(
        fill(t.budgetNone, { budget: budget.toLocaleString("fr-FR"), min: cheapest?.toLocaleString("fr-FR") ?? "—" }),
        subs,
        t.budgetQuote,
      ),
      suggestions: k.packs.slice(0, 2).map((p) => p.title),
    };
  }
  return {
    reply: paragraphs(
      fill(t.budgetIntro, { budget: budget.toLocaleString("fr-FR") }),
      bullets(packs.map(({ pack }) => `${pack.number} — ${pack.title} · ${pack.price}\n  ${pack.summary}`)),
      subs,
      t.budgetQuote,
    ),
    suggestions: packs.map(({ pack }) => pack.title),
  };
}

function renderNeed(need: ReturnType<typeof detectNeed> & object, k: Knowledge, t: BuddyDict, suggestions: string[]): BuddyReply {
  if (need.packs.length === 0 && need.services.length === 0) {
    return { reply: fill(t.needNone, { need: need.need }), suggestions };
  }
  return {
    reply: paragraphs(
      fill(t.needIntro, { need: need.need }),
      need.packs.length ? bullets(need.packs.map(({ pack, line }) => `${pack.title} · ${pack.price} — ${line}`)) : null,
      need.services.length ? paragraphs(t.servicesIntro, bullets(need.services.map((s) => `${s.title} — ${truncate(s.copy, 100)}`))) : null,
      t.orderHelp,
    ),
    suggestions: need.packs.map(({ pack }) => pack.title),
  };
}

function renderCompare([a, b]: PackRecord[], t: BuddyDict): string {
  if (!a || !b) return t.noEvidence;
  const d = diffPacks(a, b);
  return paragraphs(
    t.compareIntro,
    `${a.title} · ${a.price}\n${b.title} · ${b.price}`,
    d.common.length ? `${t.compareCommon}\n${bullets(d.common)}` : null,
    d.onlyA.length ? `${fill(t.compareOnly, { title: a.title })}\n${bullets(d.onlyA)}` : null,
    d.onlyB.length ? `${fill(t.compareOnly, { title: b.title })}\n${bullets(d.onlyB)}` : null,
  );
}

/* ------------------------------------------------------------ gabarits */

function render(id: VitrineIntentId, k: Knowledge, t: BuddyDict, suggestions: string[]): BuddyReply {
  if (id.startsWith("pack:")) {
    const pack = k.packs[Number(id.slice(5))];
    if (!pack) return { reply: t.noEvidence, suggestions };
    return {
      reply: paragraphs(
        `${pack.number} — ${pack.title} · ${pack.price}`,
        pack.copy,
        `${t.packIncludes}\n${bullets(pack.includes)}`,
        t.orderHelp,
      ),
    };
  }

  if (id.startsWith("faq:")) {
    const item = k.faq[Number(id.slice(4))];
    if (!item) return { reply: t.noEvidence, suggestions };
    return { reply: paragraphs(item.question, item.answer) };
  }

  switch (id) {
    case "help":
      return { reply: t.help, suggestions };

    case "packs":
      return {
        reply: paragraphs(
          t.packsIntro,
          bullets(k.packs.map((p) => `${p.number} — ${p.title} · ${p.price}\n  ${p.summary}`)),
          t.packsOutro,
        ),
        suggestions: k.packs.map((p) => p.title),
      };

    case "subscriptions":
      return {
        reply: paragraphs(
          t.subscriptionsIntro,
          bullets(k.subscriptions.map((s) => `${s.name} · ${s.price}\n  ${s.content}`)),
          t.orderHelp,
        ),
      };

    case "services":
      return {
        reply: paragraphs(
          t.servicesIntro,
          bullets(k.services.map((s) => `${s.title} — ${truncate(s.copy, 110)}`)),
        ),
        suggestions: [t.suggestions[0]?.question, t.suggestions[1]?.question].filter((s): s is string => !!s),
      };

    case "process":
      return {
        reply: paragraphs(t.processIntro, numbered(k.process.map((s) => `${s.title} — ${s.copy}`))),
      };

    case "contact":
      return { reply: paragraphs(t.contactIntro, k.contact.copy) };

    case "order":
      return { reply: t.orderHelp };
  }
  // Inatteignable : toute intention est traitée ci-dessus. On refuse plutôt qu'inventer.
  return { reply: t.noEvidence, suggestions };
}

/** Libellé court d'une intention, pour la question de désambiguïsation. */
function labelFor(id: VitrineIntentId, k: Knowledge, labels: BuddyDict["labels"]): string {
  if (id.startsWith("pack:")) return k.packs[Number(id.slice(5))]?.title ?? id;
  if (id.startsWith("faq:")) return `« ${truncate(k.faq[Number(id.slice(4))]?.question ?? id, 60)} »`;
  return labels[id as keyof typeof labels] ?? id;
}

/** Question à envoyer quand le visiteur clique sur une option proposée. */
function questionFor(id: VitrineIntentId, k: Knowledge, labels: BuddyDict["labels"]): string {
  if (id.startsWith("pack:")) return k.packs[Number(id.slice(5))]?.title ?? id;
  if (id.startsWith("faq:")) return k.faq[Number(id.slice(4))]?.question ?? id;
  return labels[id as keyof typeof labels] ?? id;
}
