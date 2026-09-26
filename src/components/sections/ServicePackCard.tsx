"use client";

import { useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import { PACK_CODES, startCheckout } from "@/lib/checkout";

type Pack = {
  number: string;
  title: string;
  price: string;
  summary: string;
  copy: string;
  list: string[];
  cta: string;
};

type Props = {
  pack: Pack;
  accent: string;
  gradientFrom: string;
  gradientTo: string;
  /** The top pack gets a stronger border and glow, nothing structural. */
  featured: boolean;
  showDetails: string;
  hideDetails: string;
  addToCart: string;
};

/**
 * The project has no cart or checkout, so this control does not pretend to
 * have one. It dispatches a documented `levelup:add-to-cart` CustomEvent
 * carrying the pack's identity and price, which is the seam a real cart
 * would listen on later. Until something listens, the handler falls through
 * to the contact section, so the button is never a dead control — it always
 * takes the visitor somewhere they can actually buy.
 *
 * Wiring a real cart is then one listener, with no markup change:
 *   document.addEventListener("levelup:add-to-cart", (e) => {
 *     e.preventDefault();          // suppresses the contact fallback
 *     cart.add(e.detail);
 *   });
 */
function addPackToCart(pack: Pack) {
  const event = new CustomEvent("levelup:add-to-cart", {
    detail: { id: pack.number, title: pack.title, price: pack.price },
    cancelable: true,
    bubbles: true,
  });
  const handled = !document.dispatchEvent(event);
  if (handled) return;

  // Redirection immédiate vers la connexion de la plateforme, avec l'offre.
  const code = PACK_CODES[pack.number];
  if (code && startCheckout(code)) return;

  // Repli inchangé si la plateforme est injoignable ou le pack inconnu.
  document.getElementById("contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

/**
 * Pack card that stays compact until asked to open. Collapsed it shows only
 * the one-line "Contenu" summary, so the four cards sit at a uniform,
 * scannable height; the full pitch, bullet list and contact link appear on
 * click.
 *
 * This also fixes a layout bug from the always-expanded version: the CTA was
 * `position: absolute; bottom: 30px`, so on the one pack whose copy runs
 * longest (Découverte) the bullet list grew straight through it and the two
 * overlapped. Everything is in normal flow here, so the button can never
 * collide with the text above it however uneven the packs are.
 */
export default function ServicePackCard({
  pack,
  accent,
  gradientFrom,
  gradientTo,
  featured,
  showDetails,
  hideDetails,
  addToCart,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <GlassCard
      className={featured ? "service service-featured" : "service"}
      style={{ "--accent": accent, "--pack-from": gradientFrom, "--pack-to": gradientTo } as CSSProperties}
    >
      <div className="service-number">{pack.number}</div>
      <h3>{pack.title}</h3>
      <div className="service-price">{pack.price}</div>

      {/* Always visible: the compact contents line. */}
      <p className="service-summary">{pack.summary}</p>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            className="service-details"
            key="details"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* A pack may carry no detail at all (Discovery says everything it
                needs to in its one-line summary). Each part is rendered only
                when it has content, so an empty pack never leaves an empty
                paragraph, an empty list, or a focusable link with no label. */}
            {pack.copy && <p className="service-copy">{pack.copy}</p>}
            {pack.list.length > 0 && (
              <ul className="service-list">
                {pack.list.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )}
            {pack.cta && (
              <a className="service-contact" href="#contact">
                {pack.cta}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Both controls live in one block pinned to the bottom of the card
          with `margin-top: auto`, so the cart button sits on the same line
          across all four cards however uneven their copy is, and can never
          be pushed out of the card or overlapped by the list above it. */}
      <div className="service-actions">
        <button
          type="button"
          className="service-toggle"
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? hideDetails : showDetails}
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.2}
            aria-hidden="true"
            style={{ transform: open ? "rotate(180deg)" : "none" }}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>

        <button
          type="button"
          className="service-cart"
          data-pack={pack.number}
          onClick={() => addPackToCart(pack)}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.1} aria-hidden="true">
            <path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h8.5a1 1 0 0 0 1-.78L20 8H6" />
            <circle cx="10" cy="20" r="1.4" />
            <circle cx="17" cy="20" r="1.4" />
          </svg>
          {addToCart}
        </button>
      </div>
    </GlassCard>
  );
}
