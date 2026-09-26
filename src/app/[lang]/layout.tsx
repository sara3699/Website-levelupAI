import type { Metadata } from "next";
import { Geist, Fraunces } from "next/font/google";
import { notFound } from "next/navigation";
import "../globals.css";
import { LOCALES, isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/dictionaries";
import { LocaleProvider } from "@/i18n/LocaleProvider";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  style: ["normal", "italic"],
});

/** Both locales are prerendered at build time, so adding translation did
 *  not cost the site its static generation. */
export function generateStaticParams() {
  return LOCALES.map((lang) => ({ lang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isLocale(lang)) return {};

  const dict = getDictionary(lang);
  return {
    title: dict.meta.title,
    description: dict.meta.description,
    // hreflang tags: tells search engines these are the same page in two
    // languages rather than duplicate content.
    alternates: {
      languages: {
        en: "/en",
        fr: "/fr",
      },
    },
  };
}

export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();

  const dict = getDictionary(lang);

  return (
    <html lang={lang} className={`${geist.variable} ${fraunces.variable}`}>
      <body>
        <LocaleProvider locale={lang} dict={dict}>
          {children}
        </LocaleProvider>
      </body>
    </html>
  );
}
