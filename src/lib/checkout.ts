/**
 * Passerelle vers la plateforme (levelupia.app).
 *
 * « Finaliser la commande » redirige IMMÉDIATEMENT vers la plateforme, en
 * passant l'offre choisie dans l'URL. La plateforme envoie alors le visiteur
 * sur la page de paiement par carte de la banque (ClicToPay) ; une fois le
 * paiement accepté, il crée son compte et y retrouve sa commande. Tant que le
 * paiement en ligne n'est pas ouvert côté plateforme, elle l'envoie d'elle-même
 * sur sa page de connexion, comme avant.
 *
 * Aucun appel réseau n'est fait depuis le vitrine : pas d'attente, et rien ne
 * casse si la plateforme répond lentement ou si le navigateur bloque la
 * requête inter-domaines.
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
 * Envoie le visiteur payer l'offre choisie, via la plateforme.
 * Redirection directe : aucune attente réseau, donc aucun « chargement » long.
 */
export function startCheckout(packCode: string): boolean {
  if (!packCode) return false;
  window.location.href = `${PLATFORM_URL}/api/paiement/panier?pack=${encodeURIComponent(packCode)}`;
  return true;
}

/** Name and displayed price of an offer code, in the dictionary's language. */
export function offerForCode(
  code: string,
  dict: {
    services: { packs: Array<{ code: string; title: string; price: string }> };
    pricing: {
      subscriptions: Array<{ name: string; price: string }>;
      aiServices: Array<{ title: string; price: string; code: string; tiers: Array<{ name: string; price: string; code: string }> }>;
    };
  }
): { title: string; price: string } | null {
  // Sites et packs portent leur code plateforme dans le dictionnaire (revue du 27 octobre 2026).
  const pack = dict.services.packs.find((p) => p.code === code);
  if (pack) return { title: pack.title, price: pack.price };
  const sub = dict.pricing.subscriptions.find((s) => subscriptionCode(s.name) === code);
  if (sub) return { title: sub.name, price: sub.price };
  // Offres de la liste des services (revue du 13 octobre 2026) : à l'unité ou par palier.
  for (const service of dict.pricing.aiServices) {
    if (service.code === code && service.price) return { title: service.title, price: service.price };
    const tier = service.tiers.find((tr) => tr.code === code && tr.price);
    if (tier) return { title: `${service.title} — ${tier.name}`, price: tier.price };
  }
  return null;
}
