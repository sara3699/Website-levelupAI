"use client";

import { createContext, useContext } from "react";
import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries";

/** Most of this site's sections are client components (the hero's whole
 *  subtree — Hero -> DeviceMockup -> ScreenPreviewTrack -> panels — plus
 *  FitList, VideoCarousel, AICommercials, ProcessTimeline, QuoteBox, Faq,
 *  SiteNav). They can't `await getDictionary()` the way a server component
 *  can, and prop-drilling translations through the mockup layers would mean
 *  widening several purely-structural component signatures. A context set
 *  once in the root layout is the cheaper seam. */
type LocaleContextValue = {
  locale: Locale;
  dict: Dictionary;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({
  locale,
  dict,
  children,
}: LocaleContextValue & { children: React.ReactNode }) {
  return (
    <LocaleContext.Provider value={{ locale, dict }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext);
  if (!value) {
    throw new Error("useLocale must be used inside a LocaleProvider");
  }
  return value;
}

/** Shorthand for the common case of only needing the strings. */
export function useTranslations(): Dictionary {
  return useLocale().dict;
}
