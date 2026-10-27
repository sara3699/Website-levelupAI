import CinematicBackground from "@/components/media/CinematicBackground";
import GlassCard from "@/components/ui/GlassCard";
import Reveal from "@/components/ui/Reveal";
import ServicePackCard from "./ServicePackCard";
import SubscribeButton from "./SubscribeButton";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";
import { cookies } from "next/headers";
import {
  CURRENCY_COOKIE,
  DEFAULT_CURRENCY,
  isCurrency,
  localizePrice,
} from "@/i18n/currency";

/** Visual-only per-offer data, keyed by platform code. Each card owns a
 *  distinct gradient pair plus the accent its number, title and cart button
 *  are drawn in, so the cards are told apart at a glance instead of reading
 *  as one block. The values live in tokens.css (--pack-N-*) rather than
 *  here, so the palette stays in one place and both locales render from the
 *  same source. The site vitrine keeps the violet of the former Pack 01 and
 *  each pack keeps its colour through the renumbering (2026-10-27). */
const PACK_VISUALS: Record<string, { accent: string; from: string; to: string }> = {
  SITE_VITRINE: { accent: "var(--pack-1-accent)", from: "var(--pack-1-from)", to: "var(--pack-1-to)" },
  SITE_MARCHAND: { accent: "var(--pack-5-accent)", from: "var(--pack-5-from)", to: "var(--pack-5-to)" },
  PACK_LANCEMENT: { accent: "var(--pack-2-accent)", from: "var(--pack-2-from)", to: "var(--pack-2-to)" },
  PACK_CROISSANCE: { accent: "var(--pack-3-accent)", from: "var(--pack-3-from)", to: "var(--pack-3-to)" },
  PACK_PRO_MAX: { accent: "var(--pack-4-accent)", from: "var(--pack-4-from)", to: "var(--pack-4-to)" },
};

export default async function Services({ lang }: { lang: string }) {
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);

  // Display currency comes from the visitor's country (set by proxy.ts).
  // Only the unit changes — the amount is intentionally left as written.
  const cookieStore = await cookies();
  const rawCurrency = cookieStore.get(CURRENCY_COOKIE)?.value;
  const currency = rawCurrency && isCurrency(rawCurrency) ? rawCurrency : DEFAULT_CURRENCY;

  const offers = t.services.packs.map((pack) => ({
    ...pack,
    ...PACK_VISUALS[pack.code],
    price: localizePrice(pack.price, currency),
  }));
  // The two website offers (no pack number) sit on their own row above the
  // numbered packs, so neither row ends with a lone card beside a gap.
  const rows = [offers.filter((o) => !o.number), offers.filter((o) => o.number)];
  const lastPack = rows[1].at(-1)?.code;

  return (
    <section className="section section-dark section-dark-bridge" id="packs">
      <CinematicBackground variant="services" src="/videos/services-bg.mp4" />
      <div className="wrap">
        <Reveal className="section-head">
          <div>
            <span className="section-kicker">{t.services.kicker}</span>
            <h2>{t.services.title}</h2>
          </div>
        </Reveal>

        {rows.map((row, rowIndex) => (
          <div className={rowIndex === 0 ? "services services-sites" : "services services-packs"} key={rowIndex}>
            {row.map((service, index) => (
              // Fly in one by one (2026-09-29, Sarra's pick "E"); the hover
              // spotlight ("C") is in globals.css.
              <Reveal key={service.code} delay={(index + rowIndex * 2) * 0.14} variant="fly">
                <ServicePackCard
                  pack={service}
                  accent={service.accent}
                  gradientFrom={service.from}
                  gradientTo={service.to}
                  featured={service.code === lastPack}
                  showDetails={t.services.showDetails}
                  hideDetails={t.services.hideDetails}
                  addToCart={t.services.addToCart}
                  addedToCart={t.services.addedToCart}
                />
              </Reveal>
            ))}
          </div>
        ))}

        {/* Monthly subscriptions — moved here from the Pricing section so it
            sits directly beneath the pack cards it relates to. */}
        <Reveal className="pricing-block-head subscriptions-head">
          <h3>{t.pricing.subscriptionsTitle}</h3>
          {/* Empty in both languages since 2026-10-01 (Sarra deleted the line). */}
          {t.pricing.subscriptionsLead && <p>{t.pricing.subscriptionsLead}</p>}
        </Reveal>
        <Reveal>
          <GlassCard className="pricing-table-card">
            <table className="pricing-table">
              <thead>
                <tr>
                  <th>{t.pricing.tableHeaders.plan}</th>
                  <th>{t.pricing.tableHeaders.content}</th>
                  <th>{t.pricing.tableHeaders.price}</th>
                  <th aria-label={t.services.addToCart} />
                </tr>
              </thead>
              <tbody>
                {t.pricing.subscriptions.map((sub) => (
                  <tr key={sub.name}>
                    <td data-label={t.pricing.tableHeaders.plan}>
                      <span className="plan-name">{sub.name}</span>
                    </td>
                    <td data-label={t.pricing.tableHeaders.content}>{sub.content}</td>
                    <td data-label={t.pricing.tableHeaders.price} className="pricing-price">
                      {localizePrice(sub.price, currency)}
                      {/* Longer commitments (Sarra, 2026-10-01): shown under
                          every formula's price. Display only: the cart still
                          sends the same code (ABO_STARTER…) with no duration,
                          so the platform does not know about these offers. */}
                      <span className="pricing-offers">
                        {t.pricing.subscriptionOffers.map((offer) => (
                          <span key={offer}>{offer}</span>
                        ))}
                      </span>
                    </td>
                    <td className="pricing-action">
                      <SubscribeButton name={sub.name} label={t.services.addToCart} addedLabel={t.services.addedToCart} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </GlassCard>
        </Reveal>
      </div>
    </section>
  );
}
