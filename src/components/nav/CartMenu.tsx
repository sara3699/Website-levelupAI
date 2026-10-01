"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "@/i18n/LocaleProvider";
import { currencyFromDocumentCookie, localizePrice } from "@/i18n/currency";
import { useCart } from "@/hooks/useCart";
import { useCheckoutAction } from "@/hooks/useCheckoutAction";
import { OPEN_CART_EVENT, removeFromCart } from "@/lib/cart";
import { offerForCode } from "@/lib/checkout";
import CartButtonIcon from "@/components/sections/CartButtonIcon";

/** One offer in the panel: its name and price, finish it or take it out. */
function CartRow({ code }: { code: string }) {
  const t = useTranslations();
  const { pending, checkout } = useCheckoutAction();
  const offer = offerForCode(code, t);
  // A code the dictionary no longer knows (an offer renamed since it was
  // added) is not shown rather than shown blank.
  if (!offer) return null;

  return (
    <li className="cart-row">
      <div className="cart-row-text">
        <span className="cart-row-title">{offer.title}</span>
        <span className="cart-row-price">{localizePrice(offer.price, currencyFromDocumentCookie())}</span>
      </div>
      <div className="cart-row-actions">
        {/* The platform takes one offer per order link, so each offer is
            finished on its own. The item stays in this cart: the site cannot
            tell whether payment went through, and dropping it on click would
            lose it if the visitor turns back at the login. */}
        <button
          type="button"
          className="cart-checkout"
          aria-busy={pending || undefined}
          aria-disabled={pending || undefined}
          onClick={() => checkout(code, () => {})}
        >
          {pending ? t.cart.redirecting : t.cart.checkout}
        </button>
        <button
          type="button"
          className="cart-remove"
          aria-label={t.cart.removeLabel.replace("{title}", offer.title)}
          onClick={() => removeFromCart(code)}
        >
          {t.cart.remove}
        </button>
      </div>
    </li>
  );
}

/**
 * The nav's cart: an icon with a count badge that pops each time an offer is
 * added, and a panel listing the offers with a "Complete order" button each.
 * The panel opens from the icon, or from any "In your cart" button on the
 * page (OPEN_CART_EVENT), and closes on Escape, the close button or a click
 * outside it.
 */
export default function CartMenu() {
  const t = useTranslations();
  const items = useCart();
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const count = items.length;

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_CART_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_CART_EVENT, onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.focus();
    const close = (returnFocus: boolean) => {
      setOpen(false);
      if (returnFocus) buttonRef.current?.focus();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target) || buttonRef.current?.contains(target)) return;
      close(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  return (
    <div className="nav-cart-wrap">
      <button
        ref={buttonRef}
        type="button"
        className="nav-cart"
        aria-label={count ? t.cart.open.replace("{count}", String(count)) : t.nav.cart}
        title={t.nav.cart}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
      >
        <CartButtonIcon size={19} />
        {/* Keyed by the count so the pop animation replays on every change. */}
        {count > 0 && (
          <span className="nav-cart-count" key={count} aria-hidden="true">
            {count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            id={panelId}
            ref={panelRef}
            className="cart-panel"
            role="dialog"
            aria-label={t.cart.title}
            tabIndex={-1}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="cart-panel-head">
              <p className="cart-panel-title">{t.cart.title}</p>
              <button
                type="button"
                className="cart-close"
                aria-label={t.cart.close}
                onClick={() => {
                  setOpen(false);
                  buttonRef.current?.focus();
                }}
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            {count === 0 ? (
              <div className="cart-empty">
                <p>{t.cart.empty}</p>
                <a href="#packs" onClick={() => setOpen(false)}>
                  {t.cart.browse}
                </a>
              </div>
            ) : (
              <>
                <ul className="cart-list">
                  {items.map((item) => (
                    <CartRow key={item.code} code={item.code} />
                  ))}
                </ul>
                <p className="cart-note">{t.cart.note}</p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
