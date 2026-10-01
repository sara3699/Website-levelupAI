"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import CinematicBackground from "@/components/media/CinematicBackground";
import RevealText from "@/components/ui/RevealText";
import { useLocale } from "@/i18n/LocaleProvider";

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_DRAMATIC: [number, number, number, number] = [0.76, 0, 0.24, 1];

// Cinematic-mode toggle: content blasts apart and blurs out on hide, then
// reassembles from the same blurred/scaled state on return — a bigger,
// faster motion than a gentle entrance fade, so hiding reads as a
// deliberate, punchy action. `custom` is the horizontal drift in px (sign
// picks the direction, magnitude the distance).
const cinematicContent: Variants = {
  hidden: (driftX: number) => ({
    opacity: 0,
    scale: 0.92,
    x: driftX,
    filter: "blur(14px)",
    transition: { duration: 0.5, ease: EASE_DRAMATIC },
  }),
  visible: (driftX: number) => ({
    opacity: 1,
    scale: 1,
    x: 0,
    filter: "blur(0px)",
    transition: { duration: 0.6, ease: EASE_OUT, delay: driftX < 0 ? 0 : 0.08 },
  }),
};

/** Hero background footage per locale. Keys must match the LOCALES set.
 *  Sources and why each is the size it is: see public/videos/hero/README.md. */
const HERO_VIDEOS: Record<string, { desktop: string; desktop4k?: string; mobile: string; poster: string }> = {
  en: {
    desktop: "/videos/hero/hero-en-desktop-1080p_2026-09-29_purple.mp4",
    // AI-upscaled (not native) 4K, served to high-resolution screens only.
    desktop4k: "/videos/hero/hero-en-desktop-2160p_2026-09-29_purple.mp4",
    // Made from the AI 4K upscale. A phone shows the hero full-height,
    // ~2,550 physical px, so this is 1440x2540 rather than 1080 wide.
    mobile: "/videos/hero/hero-en-mobile-1440x2540_2026-09-29_purple.mp4",
    poster: "/videos/hero/hero-en-poster_2026-09-25_from-4k.jpg",
  },
  fr: {
    desktop: "/videos/hero/hero-fr-desktop-1080p_2026-09-29_purple.mp4",
    desktop4k: "/videos/hero/hero-fr-desktop-2160p_2026-09-29_purple.mp4",
    mobile: "/videos/hero/hero-fr-mobile-1440x2540_2026-09-29_purple.mp4",
    poster: "/videos/hero/hero-fr-poster_2026-09-25_from-4k.jpg",
  },
};

export default function Hero() {
  const { locale, dict: copy } = useLocale();
  const heroVideo = HERO_VIDEOS[locale] ?? HERO_VIDEOS.en;
  // Cinematic mode: hides the copy so only the background video shows.
  // Starts visible on both server and first client paint — it's a
  // user-driven toggle, never something that should differ between SSR
  // and hydration.
  const [cinematicMode, setCinematicMode] = useState(false);

  return (
    <section className="hero hero-device">
      <CinematicBackground
        variant="hero"
        className="hero-cine-bg"
        src={heroVideo.desktop}
        mobileSrc={heroVideo.mobile}
        hiResSrc={heroVideo.desktop4k}
        poster={heroVideo.poster}
        priority
        ripple
        sound
        // The hero is a 33-second ad with a voice-over, not ambient footage:
        // it plays once and stops on its own end card ("DM / Level up IA").
        // The sound button replays it from the start.
        loop={false}
        parallax={false}
      />
      <button
        type="button"
        className="hero-cinematic-toggle"
        onClick={() => setCinematicMode((value) => !value)}
        aria-pressed={cinematicMode}
        aria-label={cinematicMode ? copy.hero.showText : copy.hero.hideText}
      >
        <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
          {cinematicMode ? (
            <path d="M4 4l16 16M9 9a3 3 0 0 0 4.24 4.24M6.1 6.1C3.9 7.6 2.4 9.6 1 12c1.6 2.8 5.5 7 11 7 1.9 0 3.6-.5 5.1-1.3M14.5 5.2A10.9 10.9 0 0 1 23 12c-.6 1.1-1.4 2.3-2.4 3.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          ) : (
            <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7Z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
          )}
        </svg>
        <span>{cinematicMode ? copy.hero.showText : copy.hero.hideText}</span>
      </button>

      {/* Desktop: the eyebrow at the top-left, the services headline and the
          CTAs at the bottom-left, all on the video. The lower middle stays
          empty for the video's "DM / Level up IA" end card, the frame it
          stops on. Up to 980px the eyebrow and CTAs fill the first screen
          and the headline follows (.hero-intro).
          Stays permanently mounted — cinematic mode switches the `animate`
          state rather than unmounting, so RevealText never replays. */}
      <motion.div
        className="wrap hero-grid hero-grid-device"
        animate={cinematicMode ? "hidden" : "visible"}
        variants={cinematicContent}
        custom={-70}
        style={{ pointerEvents: cinematicMode ? "none" : "auto" }}
      >
        <div className="hero-content">
          <div className="hero-main">
            {/* The hero's display line. `eyebrow` is a per-locale array of
                lines, not a single string, so each locale controls its own
                break explicitly instead of leaving it to the measure —
                French must read "Digital Marketing" / "Agency par IA" on two
                lines, and no width should ever split "Digital Marketing".
                A <p>, not a heading: the page's single <h1> is the
                RevealText block below. */}
            <motion.p
              className="eyebrow"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT }}
            >
              <span className="eyebrow-dot"></span>
              <span className="eyebrow-text">
                {copy.hero.eyebrow.map((line: string) => (
                  <span className="eyebrow-line" key={line}>
                    {line}
                  </span>
                ))}
                <span className="eyebrow-rule" aria-hidden="true"></span>
              </span>
            </motion.p>

            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.7 }}
            >
              <a className="button glass-gold-border" href="#contact">
                {copy.hero.ctaPrimary}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.3}>
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
              <a className="button secondary" href="#services">
                {copy.hero.ctaSecondary}
              </a>
            </motion.div>
          </div>

          <div className="hero-intro">
            <RevealText
              as="h1"
              className="hero-h1"
              delay={0.15}
              lines={[
                copy.hero.headline[0],
                <span className="underline" key="u">{copy.hero.headline[1]}</span>,
                copy.hero.headline[2],
              ]}
            />
          </div>
        </div>
      </motion.div>
    </section>
  );
}
