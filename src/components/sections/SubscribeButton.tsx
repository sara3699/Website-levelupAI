"use client";

import { useState } from "react";
import { subscriptionCode } from "@/lib/checkout";
import { addToCart, openCart } from "@/lib/cart";
import { useCart } from "@/hooks/useCart";
import CartButtonIcon from "./CartButtonIcon";

/**
 * Bouton d'abonnement du tableau « Abonnements mensuels ».
 * Comme pour les packs, il ajoute l'offre au panier du site (le badge du menu
 * la compte) ; la commande se finalise depuis le panneau du panier. Une fois
 * l'offre dans le panier, le bouton ouvre ce panneau au lieu de la rajouter.
 */
export default function SubscribeButton({
  name,
  label,
  addedLabel,
}: {
  name: string;
  label: string;
  addedLabel: string;
}) {
  const code = subscriptionCode(name);
  const inCart = useCart().some((item) => item.code === code);
  const [announce, setAnnounce] = useState("");
  if (!code) return null;

  function onClick() {
    if (inCart) {
      openCart();
      return;
    }
    addToCart(code!);
    setAnnounce(`${name}: ${addedLabel}`);
  }

  return (
    <>
      <button type="button" className="pricing-cart" data-in-cart={inCart || undefined} onClick={onClick}>
        <CartButtonIcon added={inCart} size={16} />
        {inCart ? addedLabel : label}
      </button>
      <span className="sr-only" role="status">
        {announce}
      </span>
    </>
  );
}
