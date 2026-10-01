/**
 * The site's own cart: the offers a visitor picked, kept in this browser
 * until they finish the order on the platform.
 *
 * Only offer codes are stored (PACK_* / ABO_*, see checkout.ts). Names and
 * prices are looked up from the dictionary when the cart is shown, so they
 * follow the page language, and the platform re-reads the real price when
 * the order is finished — nothing priced is trusted from here.
 *
 * localStorage can be missing or throw (private mode, blocked storage), so
 * every access is guarded: the cart then simply lasts for the page view.
 */

export type CartItem = { code: string; addedAt: number };

const STORAGE_KEY = "levelup:cart";
/** Same-tab change signal; other tabs hear the native `storage` event. */
const CHANGE_EVENT = "levelup:cart-change";
/** Asks the nav cart panel to open (fired by the "In your cart" buttons). */
export const OPEN_CART_EVENT = "levelup:cart-open";

const EMPTY: CartItem[] = [];
let cache: CartItem[] | null = null;

function read(): CartItem[] {
  try {
    const parsed: unknown = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CartItem => typeof item?.code === "string" && typeof item?.addedAt === "number"
    );
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  cache = items;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Storage unavailable: the in-memory cache still drives this page view.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Current items. Stable between changes, as useSyncExternalStore requires. */
export function getCartSnapshot(): CartItem[] {
  if (cache === null) cache = read();
  return cache;
}

/** The server never has a cart; the client fills it in after hydration. */
export function getServerCartSnapshot(): CartItem[] {
  return EMPTY;
}

export function subscribeCart(onChange: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    cache = null;
    onChange();
  };
  window.addEventListener(CHANGE_EVENT, onChange);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onStorage);
  };
}

/** Adds an offer once. Returns false if it was already in the cart. */
export function addToCart(code: string): boolean {
  const items = getCartSnapshot();
  if (items.some((item) => item.code === code)) return false;
  write([...items, { code, addedAt: Date.now() }]);
  return true;
}

export function removeFromCart(code: string) {
  write(getCartSnapshot().filter((item) => item.code !== code));
}

export function openCart() {
  window.dispatchEvent(new Event(OPEN_CART_EVENT));
}
