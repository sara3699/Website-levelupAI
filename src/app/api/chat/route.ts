import { answer } from "@/buddy/answer";
import { DEFAULT_LOCALE, isLocale } from "@/i18n/config";

/**
 * Chatbot du site, sans modèle et sans service extérieur.
 *
 * Le navigateur envoie le fil de conversation ; seul le dernier message du
 * visiteur compte, car chaque question est traitée seule par le routeur
 * d'intentions. Rien ne sort du serveur : ni clé, ni appel réseau.
 *
 * Le contrat de la réponse (`{ reply }`) est celui que le widget attendait
 * déjà ; il gagne seulement des `suggestions` cliquables.
 */

const MAX_CHARS = 1500;
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 30;

type ChatMessage = { role: "user" | "assistant"; content: string };

/** Anti-abus : au plus 30 messages par minute et par adresse (mémoire du process). */
const hits = new Map<string, number[]>();
function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    hits.set(ip, recent);
    return true;
  }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // garde-fou mémoire
  return false;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "inconnue";
  if (rateLimited(ip)) {
    return Response.json({ error: "Too many messages. Please wait a minute." }, { status: 429 });
  }

  let body: { messages?: ChatMessage[]; locale?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }

  const rawLocale = body.locale ?? "";
  const locale = isLocale(rawLocale) ? rawLocale : DEFAULT_LOCALE;

  // Le dernier message du visiteur, et lui seul : le routeur n'a pas de mémoire.
  const last = (Array.isArray(body.messages) ? body.messages : [])
    .filter((m) => !!m && m.role === "user" && typeof m.content === "string")
    .at(-1);
  const question = last?.content.trim().slice(0, MAX_CHARS) ?? "";

  if (!question) {
    return Response.json({ error: "No message provided." }, { status: 400 });
  }

  return Response.json(answer(question, locale));
}
