"use client";

import { subscriptionCode, startCheckout } from "@/lib/checkout";

/**
 * Bouton d'abonnement du tableau « Abonnements mensuels ».
 * Comme pour les packs, seul le code de l'offre part d'ici : la plateforme
 * relit le prix et signe la commande.
 */
export default function SubscribeButton({ name, label }: { name: string; label: string }) {
  const code = subscriptionCode(name);
  if (!code) return null;

  function go() {
    if (startCheckout(code!)) return;
    document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <button type="button" className="pricing-cart" onClick={go}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} aria-hidden="true">
        <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.5a1 1 0 0 0 1-.78L20 8H6" />
        <circle cx="10" cy="20" r="1.4" />
        <circle cx="17" cy="20" r="1.4" />
      </svg>
      {label}
    </button>
  );
}
