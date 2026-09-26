/**
 * Passerelle vers la plateforme (levelupia.app).
 *
 * Le clic « Ajouter au panier » redirige IMMÉDIATEMENT vers la connexion de la
 * plateforme, en passant l'offre choisie dans l'URL. Aucun appel réseau n'est
 * fait depuis le vitrine : pas d'attente, et rien ne casse si la plateforme
 * répond lentement ou si le navigateur bloque la requête inter-domaines.
 *
 * L'offre voyage en clair (un simple code), ce qui est sans risque : la
 * plateforme relit le prix dans sa base et n'accorde jamais d'accès payant sur
 * la foi de ce paramètre.
 */

/** Base de la plateforme, surchargeable par variable d'environnement. */
export const PLATFORM_URL = (
  process.env.NEXT_PUBLIC_PLATFORM_URL ?? "https://levelupia.app"
)
  .replace(/\/+$/, "")
  // un port interne (…:3000) ne serait pas joignable depuis l'extérieur
  .replace(/^(https:\/\/[^/:]+):\d+$/, "$1");

/** Numéro de pack affiché → code attendu par la plateforme. */
export const PACK_CODES: Record<string, string> = {
  "PACK 01": "PACK_DECOUVERTE",
  "PACK 02": "PACK_LANCEMENT",
  "PACK 03": "PACK_CROISSANCE",
  "PACK 04": "PACK_PRO_MAX",
};

/**
 * Nom d'abonnement → code plateforme. La comparaison est faite sans accents ni
 * casse pour rester valable en français comme en anglais.
 */
const SUBSCRIPTION_CODES: Array<{ match: RegExp; code: string }> = [
  { match: /starter/i, code: "ABO_STARTER" },
  { match: /^pro\b/i, code: "ABO_PRO" },
  { match: /r[ée]seaux|social/i, code: "ABO_SOCIAL" },
];

export function subscriptionCode(name: string): string | null {
  const plain = name.normalize("NFD").replace(/[̀-ͯ]/g, "");
  return SUBSCRIPTION_CODES.find((s) => s.match.test(plain))?.code ?? null;
}

/**
 * Envoie le visiteur sur la connexion de la plateforme avec l'offre choisie.
 * Redirection directe : aucune attente réseau, donc aucun « chargement » long.
 */
export function startCheckout(packCode: string): boolean {
  if (!packCode) return false;
  window.location.href = `${PLATFORM_URL}/login?pack=${encodeURIComponent(packCode)}`;
  return true;
}
