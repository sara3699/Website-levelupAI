import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
  localeFromAcceptLanguage,
  localeFromCountry,
  type Locale,
} from "@/i18n/config";
import {
  CURRENCY_COOKIE,
  CURRENCY_COOKIE_MAX_AGE,
  DEFAULT_CURRENCY,
  currencyFromCountry,
  isCurrency,
  type Currency,
} from "@/i18n/currency";

/** Geo headers by host, tried in order. `request.geo` was removed in
 *  Next.js 15, so the country has to come from whatever the edge put on
 *  the request. Vercel first (this project's target), then the other
 *  common ones so the site still detects correctly if it moves hosts. */
const GEO_HEADERS = [
  "x-vercel-ip-country", // Vercel
  "cf-ipcountry",        // Cloudflare
  "x-nf-country",        // Netlify
  "x-country-code",      // Fastly / misc proxies
];

function detectCountry(request: NextRequest): string | null {
  for (const header of GEO_HEADERS) {
    const value = request.headers.get(header);
    if (value) return value;
  }
  return null;
}

/** Display currency, resolved from the same geo signal as the locale.
 *  An explicit cookie wins, exactly as it does for language. */
function detectCurrency(request: NextRequest): Currency {
  const cookie = request.cookies.get(CURRENCY_COOKIE)?.value;
  if (cookie && isCurrency(cookie)) return cookie;
  return currencyFromCountry(detectCountry(request)) ?? DEFAULT_CURRENCY;
}

function detectLocale(request: NextRequest): Locale {
  // 1. Explicit choice always wins.
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && isLocale(cookie)) return cookie;

  // 2. Country from the edge.
  for (const header of GEO_HEADERS) {
    const byCountry = localeFromCountry(request.headers.get(header));
    if (byCountry) return byCountry;
  }

  // 3. Browser preference — the only signal available in local dev.
  const byLanguage = localeFromAcceptLanguage(request.headers.get("accept-language"));
  if (byLanguage) return byLanguage;

  return DEFAULT_LOCALE;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Already localised — nothing to do.
  const hasLocale = LOCALES.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`)
  );
  if (hasLocale) {
    const passthrough = NextResponse.next();
    if (!request.cookies.get(CURRENCY_COOKIE)) {
      passthrough.cookies.set(CURRENCY_COOKIE, detectCurrency(request), {
        maxAge: CURRENCY_COOKIE_MAX_AGE,
        sameSite: "lax",
        path: "/",
      });
    }
    return passthrough;
  }

  const locale = detectLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;

  const response = NextResponse.redirect(url);
  // Persist the detected locale so later requests skip detection and stay
  // consistent — without this, a visitor behind a rotating-exit VPN could
  // be bounced between languages between page loads.
  response.cookies.set(LOCALE_COOKIE, locale, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });
  response.cookies.set(CURRENCY_COOKIE, detectCurrency(request), {
    maxAge: CURRENCY_COOKIE_MAX_AGE,
    sameSite: "lax",
    path: "/",
  });
  return response;
}

export const config = {
  // Skip Next internals, API routes, and anything with a file extension.
  // The extension check matters a lot here: this site serves many large
  // .mp4 files from public/, and redirecting those would break playback.
  matcher: ["/((?!_next/static|_next/image|api|favicon.ico|.*\\.[\\w]+$).*)"],
};
