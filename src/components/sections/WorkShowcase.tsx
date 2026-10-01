import VideoSlot from "@/components/media/VideoSlot";
import GlassCard from "@/components/ui/GlassCard";
import Reveal from "@/components/ui/Reveal";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale, DEFAULT_LOCALE } from "@/i18n/config";

/** LevelUp AI's own Instagram account, shown beside the section title. */
const INSTAGRAM_URL = "https://www.instagram.com/levelup.conseil/";
const INSTAGRAM_HANDLE = "@levelup.conseil";

/** The Instagram glyph (rounded square, lens, flash dot) in its brand gradient. */
function InstagramGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id="work-ig-gradient" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#FEDA75" />
          <stop offset=".28" stopColor="#FA7E1E" />
          <stop offset=".52" stopColor="#D62976" />
          <stop offset=".76" stopColor="#962FBF" />
          <stop offset="1" stopColor="#4F5BD5" />
        </linearGradient>
      </defs>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.5" stroke="url(#work-ig-gradient)" strokeWidth="2" />
      <circle cx="12" cy="12" r="4.3" stroke="url(#work-ig-gradient)" strokeWidth="2" />
      <circle cx="17.4" cy="6.6" r="1.3" fill="url(#work-ig-gradient)" />
    </svg>
  );
}

export default async function WorkShowcase({ lang }: { lang: string }) {
  const t = getDictionary(isLocale(lang) ? lang : DEFAULT_LOCALE);

  return (
    <section className="section section-vivid section-vivid-work" id="work" style={{ paddingTop: 10 }}>
      <div className="wrap">
        <Reveal className="section-head">
          <div>
            <span className="section-kicker">{t.work.kicker}</span>
            <div className="work-title-row">
              <h2>{t.work.title}</h2>
              <a
                className="work-instagram"
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={t.work.instagramLabel}
              >
                <InstagramGlyph />
                <span>{INSTAGRAM_HANDLE}</span>
              </a>
            </div>
          </div>
        </Reveal>

        {/* All the reference videos live under this heading: these two, then
            the carousel (VideoCarousel) and the AI ads (AICommercials), whose
            own headings were removed on 2026-09-25 so the three read as one
            "Nos références" section. */}
        <div className="work-grid">
          <Reveal as="article" delay={0.1}>
            <GlassCard className="work-card" tilt={false}>
              <span className="work-tag">{t.work.commercialTag}</span>
              <VideoSlot
                className="video-showcase"
                src="/videos/product-commercial_2026-09-25_hq.mp4"
                fallback={
                  <div className="video-product">
                    {t.work.productFallback[0]}<br />{t.work.productFallback[1]}
                  </div>
                }
              />
            </GlassCard>
          </Reveal>

          <Reveal as="article" delay={0.18}>
            <GlassCard className="work-card" tilt={false}>
              {/* Same badge as the first card's, over the video (2026-09-26). */}
              <span className="work-tag">{t.work.sportTag}</span>
              <VideoSlot
                className="work-video-showcase"
                src="/videos/new/14_2026-09-25_hq.mp4"
                fallback={<div className="work-video-fallback" />}
              />
            </GlassCard>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
