"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { startCheckout } from "@/lib/checkout";

/**
 * Click handling shared by every cart button (the four packs and the
 * monthly subscriptions).
 *
 * A click sends the visitor to the platform with the offer's code (see
 * startCheckout). Two things this adds on top of that:
 *
 *  - Feedback. `pending` flips the button to its "Adding to cart…" state
 *    and an aria-live status, which stays on screen while the platform
 *    page loads.
 *  - One request per click burst. The ref guard drops every click after
 *    the first, so a double-click cannot send the offer to the platform
 *    twice. The ref, not the state, is the guard: state only updates on
 *    the next render, and a fast second click lands before that.
 *
 * Coming back with the browser's Back button can restore this page from
 * the back/forward cache exactly as it was left — button still pending.
 * `pageshow` with `persisted` is that restore, so the state resets there.
 */
export function useCheckoutAction() {
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);

  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      pendingRef.current = false;
      setPending(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  /** Sends `code` to the platform, or runs `fallback` when there is none. */
  const checkout = useCallback((code: string | null | undefined, fallback: () => void) => {
    if (pendingRef.current) return;
    if (!code) {
      fallback();
      return;
    }
    pendingRef.current = true;
    setPending(true);
    if (!startCheckout(code)) {
      pendingRef.current = false;
      setPending(false);
      fallback();
    }
  }, []);

  return { pending, checkout };
}
