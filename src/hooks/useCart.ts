"use client";

import { useSyncExternalStore } from "react";
import { getCartSnapshot, getServerCartSnapshot, subscribeCart, type CartItem } from "@/lib/cart";

/** The cart's items, kept in sync across components and browser tabs. */
export function useCart(): CartItem[] {
  return useSyncExternalStore(subscribeCart, getCartSnapshot, getServerCartSnapshot);
}
