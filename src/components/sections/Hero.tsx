"use client";

import { useRef, useState } from "react";
import { motion, type Variants } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import CinematicBackground from "@/components/media/CinematicBackground";
import RevealText from "@/components/ui/RevealText";
import DeviceMockup from "@/components/hero/DeviceMockup";
import AutomationPhone from "@/components/hero/AutomationPhone";
import { useLocale } from "@/i18n/LocaleProvider";
import { useCursorTilt } from "@/hooks/useCursorTilt";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_DRAMATIC: [number, number, number, number] = [0.76, 0, 0.24, 1];

// Cinematic-mode toggle: content blasts apart and blurs out on hide, then
// reassembles from the same blurred/scaled state on return — a bigger,
// faster motion than a gentle entrance fade, so hiding reads as a
// deliberate, punchy action. `custom` is the horizontal drift in px (sign
// picks the direction, magnitude the distance) — negative drifts left
// (the text column), positive drifts right (the device mockup), so the
// two halves fly apart from and reassemble toward the video's center.
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

/** Hero background footage per locale. Keys must match the LOCALES set. */
const HERO_VIDEOS: Record<string, { desktop: string; mobile: string }> = {
  en: { desktop: "/desktop-preview-v2.mp4", mobile: "/phone-preview-v2.mp4" },
  fr: { desktop: "/desktop-preview-v2-fr.mp4", mobile: "/phone-preview-v2-fr.mp4" },
};

export default function Hero() {
  const { locale, dict: copy } = useLocale();
  // French visitors get the French-language cut of the hero footage; every
  // other locale keeps the original. Suffix-based so adding a locale only
  // means dropping "<name>-<locale>.mp4" into public/ and extending the map.
  const heroVideo = HERO_VIDEOS[locale] ?? HERO_VIDEOS.en;
  const { containerRef: tiltRef, tiltX, tiltY } = useCursorTilt();
  const sectionRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  // Cinematic mode: hides the copy + device mockup so only the background
  // video shows. Starts visible on both server and first client paint —
  // it's a user-driven toggle, never something that should differ between
  // SSR and hydration.
  const [cinematicMode, setCinematicMode] = useState(false);
  // Desktop-pin-driven phone phase. undefined until the pin actually
  // engages (mobile / reduced-motion never set this), so AutomationPhone
  // falls back to its own timer in those cases.
  const [phonePhase, setPhonePhase] = useState<number | undefined>(undefined);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const mm = gsap.matchMedia();

      mm.add("(min-width: 980px)", () => {
        if (!pinRef.current || !trackRef.current) return;

        // Pixel-based, not yPercent: yPercent is relative to the TRACK's
        // own height (3x the screen window, since it holds 3 stacked
        // panels), not the screen window's height — using yPercent: -100
        // to mean "advance one panel" is wrong by a factor of 3. Measure
        // the real screen window height and tween `y` in pixels instead.
        const screenWindow = trackRef.current.parentElement;
        const panelHeight = screenWindow ? screenWindow.getBoundingClientRect().height : 0;
        if (!panelHeight) return;

        // Timeline shape: [dwell panel1] [pan 1→2] [dwell panel2] [pan 2→3] [dwell panel3]
        // Each dwell holds the current panel still (readable); each pan
        // scrolls to the next. Label positions are explicit timeline
        // seconds, mapped onto the pin's real scroll budget below — same
        // technique as ProcessTimeline's `steps.length * 360`, just with
        // dwell+pan sub-segments instead of one tween per step.
        const DWELL = 1;
        const PAN = 0.6;
        const pan1Start = DWELL;
        const pan2Start = DWELL + PAN + DWELL;
        // Trailing dwell after the last pan — GSAP timelines auto-size to
        // the furthest tween, so this must be an explicit tween/marker, not
        // just implied by totalUnits math, or the timeline's real duration
        // falls short of the intended budget and the scrub finishes early,
        // leaving dead (empty-screen) scroll before the pin releases.
        const trailingDwellStart = pan2Start + PAN;
        const totalUnits = trailingDwellStart + DWELL;
        const pxPerUnit = 340;
        const totalPx = Math.round(totalUnits * pxPerUnit);

        // Phase boundaries at the midpoint of each pan (halfway through the
        // transition reads better than switching exactly at pan-start).
        const phase1Boundary = pan1Start + PAN / 2;
        const phase2Boundary = pan2Start + PAN / 2;

        // Set synchronously now, not just from the scrub — without this,
        // phonePhase stays undefined for a real gap after mount and
        // AutomationPhone starts its own uncontrolled timer in that
        // window, racing the pin.
        setPhonePhase(0);

        // React to phase crossings via a lightweight, throttled ticker
        // driven by ScrollTrigger's own progress, not a setState call
        // inside onUpdate — onUpdate fires on every scroll recalculation
        // during the scrub (many times per scroll gesture), and forcing a
        // React render pass that often, on top of GSAP's own tween work
        // and the video shader, was the real source of the scroll jank
        // reported against this section. requestAnimationFrame throttles
        // this to at most once per rendered frame.
        let lastPhase = 0;
        let phaseRaf = 0;
        const syncPhase = () => {
          phaseRaf = 0;
          const t = tl.time();
          const phase = t < phase1Boundary ? 0 : t < phase2Boundary ? 1 : 2;
          if (phase !== lastPhase) {
            lastPhase = phase;
            setPhonePhase(phase);
          }
        };

        // Pin flush against the fixed nav's own height, not the raw
        // viewport top — without this offset the pinned laptop content
        // sits directly under the 82px nav bar with zero clearance, so
        // panel text/buttons near the top visually collide with it.
        const navHeight = document.querySelector(".nav")?.getBoundingClientRect().height ?? 82;

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: pinRef.current,
            start: `top top+=${navHeight}`,
            end: `+=${totalPx}`,
            scrub: 0.6,
            pin: true,
            pinType: "transform",
            anticipatePin: 1,
            onUpdate: () => {
              if (!phaseRaf) phaseRaf = requestAnimationFrame(syncPhase);
            },
          },
        });

        tl.to(trackRef.current, { y: -panelHeight, ease: "none", duration: PAN }, pan1Start);
        tl.to(trackRef.current, { y: -panelHeight * 2, ease: "none", duration: PAN }, pan2Start);
        tl.to({}, { duration: DWELL }, trailingDwellStart);

        return () => {
          if (phaseRaf) cancelAnimationFrame(phaseRaf);
          tl.scrollTrigger?.kill();
          tl.kill();
          setPhonePhase(undefined);
        };
      });

      // Nothing here for narrow screens on purpose. Below the pin's
      // breakpoint the panels are not panned at all: the stylesheet stacks
      // them instead (see the `.laptop-screen` fallback in
      // device-mockup.css), so all three are reachable by scrolling the page
      // normally. That has no timer and no ScrollTrigger to stall, which is
      // what the animated version kept doing on phones.
    },
    // revertOnUpdate: true — by default @gsap/react's useGSAP only reverts
    // its GSAP context on unmount, not when `dependencies` change; without
    // this, flipping reducedMotion from false→true (which the app's own
    // usePrefersReducedMotion hook always does once, shortly after mount,
    // by design) re-runs the callback and hits the early return, but never
    // cleans up the pin/timeline the first (false) run already created —
    // the pin silently stays active under reduced motion.
    { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true }
  );

  return (
    <section className="hero hero-device" ref={sectionRef}>
      <CinematicBackground
        variant="hero"
        className="hero-cine-bg"
        src={heroVideo.desktop}
        mobileSrc={heroVideo.mobile}
        poster="/videos/hero-bg-poster.jpg"
        priority
        ripple
        sound
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

      {/* Both halves below stay permanently mounted — the text column
          holds RevealText's own once-only mount entrance, and the device
          column holds pinRef/tiltRef (live GSAP ScrollTrigger + Framer
          tilt targets). AnimatePresence-unmounting either on toggle would
          replay RevealText's stagger every time and, worse, tear down the
          scroll pin. Cinematic mode instead switches each wrapper's own
          `animate` state between "visible" and "hidden" — same blast-apart
          variant, applied as a visual layer on top of content that never
          leaves the DOM. */}
      <motion.div
        className="wrap hero-grid hero-grid-device"
        animate={cinematicMode ? "hidden" : "visible"}
        variants={cinematicContent}
        custom={-70}
        style={{ pointerEvents: cinematicMode ? "none" : "auto" }}
      >
        <div className="hero-content">
          {/* The hero's display line. `eyebrow` is a per-locale array of
              lines, not a single string, so each locale controls its own
              break explicitly instead of leaving it to the measure —
              French must read "Digital Marketing" / "Agency par IA" on two
              lines, and no width should ever split "Digital Marketing".
              A <p>, not a heading: the page's single <h1> is the
              RevealText block directly below this one. */}
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
      </motion.div>

      {/* Clear-video scroll runway — see .hero-video-runway. Keeps the
          laptop out of frame until you've scrolled past a screenful of
          the background video on its own. */}
      <div className="hero-video-runway" aria-hidden="true" />

      <motion.div
        className="wrap hero-device-wrap"
        ref={pinRef}
        animate={cinematicMode ? "hidden" : "visible"}
        variants={cinematicContent}
        custom={70}
        style={{ pointerEvents: cinematicMode ? "none" : "auto" }}
      >
        <div ref={tiltRef}>
          <DeviceMockup tiltX={tiltX} tiltY={tiltY} trackRef={trackRef} />
          <div className="hero-device-phone">
            <AutomationPhone tiltX={tiltX} tiltY={tiltY} activeIndex={phonePhase} />
          </div>
        </div>
      </motion.div>

      {/* Supporting copy + CTAs live BELOW the device stage, not beside the
          H1. The hero's background is a full-bleed product video, and the
          old stacked-in-the-text-column position parked this card right
          over the video's focal area. Moving it under the desktop mockup
          leaves the upper hero clear so the video reads properly, and
          keeps the reading order headline → demo → pitch → CTA. */}
      <motion.div
        className="wrap hero-below"
        animate={cinematicMode ? "hidden" : "visible"}
        variants={cinematicContent}
        custom={-70}
        style={{ pointerEvents: cinematicMode ? "none" : "auto" }}
      >
        <motion.div
          className="hero-copy-panel glass"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: EASE_OUT, delay: 0.55 }}
        >
          <p className="hero-copy">{copy.hero.copy}</p>

          <div className="hero-proof">
            {copy.hero.proof.map((item: string) => (
              <span className="proof-item" key={item}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><path d="m5 12 4 4L19 6" /></svg>
                {item}
              </span>
            ))}
          </div>
        </motion.div>

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
      </motion.div>
    </section>
  );
}
