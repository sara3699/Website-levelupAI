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

/** Visual-only per-pack data. Each pack owns a distinct gradient pair plus
 *  the accent its number, title and cart button are drawn in, so the four
 *  cards are told apart at a glance instead of reading as one block. The
 *  values live in tokens.css (--pack-N-*) rather than here, so the palette
 *  stays in one place and both locales render from the same source. */
const PACK_VISUALS = [
  { accent: "var(--pack-1-accent)", from: "var(--pack-1-from)", to: "var(--pack-1-to)" },
  { accent: "var(--pack-2-accent)", from: "var(--pack-2-from)", to: "var(--pack-2-to)" },
  { accent: "var(--pack-3-accent)", from: "var(--pack-3-from)", to: "var(--pack-3-to)" },
  { accent: "var(--pack-4-accent)", from: "var(--pack-4-from)", to: "var(--pack-4-to)" },
];

export default async function Services({ lang }: { lang: string }) {
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);

  // Display currency comes from the visitor's country (set by proxy.ts).
  // Only the unit changes — the amount is intentionally left as written.
  const cookieStore = await cookies();
  const rawCurrency = cookieStore.get(CURRENCY_COOKIE)?.value;
  const currency = rawCurrency && isCurrency(rawCurrency) ? rawCurrency : DEFAULT_CURRENCY;

  const packs = t.services.packs.map((pack, i) => ({
    ...pack,
    ...PACK_VISUALS[i],
    price: localizePrice(pack.price, currency),
  }));

  return (
    <section className="section section-dark section-dark-bridge" id="packs">
      <CinematicBackground variant="services" src="/videos/services-bg.mp4" />
      <div className="wrap">
        <Reveal className="section-head">
          <div>
            <span className="section-kicker">{t.services.kicker}</span>
            <h2>{t.services.title}</h2>
          </div>
          <p className="section-lead">{t.services.lead}</p>
        </Reveal>

        <div className="services">
          {packs.map((service, index) => (
            <Reveal key={service.number} delay={index * 0.1}>
              <ServicePackCard
                pack={service}
                accent={service.accent}
                gradientFrom={service.from}
                gradientTo={service.to}
                featured={index === 3}
                showDetails={t.services.showDetails}
                hideDetails={t.services.hideDetails}
                addToCart={t.services.addToCart}
              />
            </Reveal>
          ))}
        </div>

        {/* Monthly subscriptions — moved here from the Pricing section so it
            sits directly beneath the pack cards it relates to. */}
        <Reveal className="pricing-block-head subscriptions-head">
          <h3>{t.pricing.subscriptionsTitle}</h3>
          <p>{t.pricing.subscriptionsLead}</p>
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
                    <td data-label={t.pricing.tableHeaders.plan}>{sub.name}</td>
                    <td data-label={t.pricing.tableHeaders.content}>{sub.content}</td>
                    <td data-label={t.pricing.tableHeaders.price} className="pricing-price">{localizePrice(sub.price, currency)}</td>
                    <td className="pricing-action">
                      <SubscribeButton name={sub.name} label={t.services.addToCart} />
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
