"use client";

import { useState, type CSSProperties } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import { PACK_CODES } from "@/lib/checkout";
import { addToCart, openCart } from "@/lib/cart";
import { useCart } from "@/hooks/useCart";
import CartButtonIcon from "./CartButtonIcon";

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
  addedToCart: string;
};

function scrollToContact() {
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
  addToCart: addToCartLabel,
  addedToCart,
}: Props) {
  const [open, setOpen] = useState(false);
  const [announce, setAnnounce] = useState("");
  const code = PACK_CODES[pack.number];
  const inCart = useCart().some((item) => item.code === code);

  // Adds the pack to the site's cart (the nav badge counts it) and stays on
  // the page; the order is finished from the cart panel. Once it is in the
  // cart the button opens the panel instead, so it can never be added twice.
  function addToCartClick() {
    if (!code) {
      scrollToContact();
      return;
    }
    if (inCart) {
      openCart();
      return;
    }
    addToCart(code);
    setAnnounce(`${pack.title}: ${addedToCart}`);
  }

  return (
    <GlassCard
      className={featured ? "service service-featured" : "service"}
      style={{ "--accent": accent, "--pack-from": gradientFrom, "--pack-to": gradientTo } as CSSProperties}
    >
      {/* Decorative glitter: twinkling stars and drifting glints, all CSS
          (see .service-sparkles). Hidden from screen readers. */}
      <span className="service-sparkles" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <span key={i}>✦</span>
        ))}
      </span>
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
          data-in-cart={inCart || undefined}
          onClick={addToCartClick}
        >
          <CartButtonIcon added={inCart} />
          {inCart ? addedToCart : addToCartLabel}
        </button>
        <span className="sr-only" role="status">
          {announce}
        </span>
      </div>
    </GlassCard>
  );
}
