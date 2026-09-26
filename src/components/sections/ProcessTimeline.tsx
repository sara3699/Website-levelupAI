"use client";

import { useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Reveal from "@/components/ui/Reveal";
import { useTranslations } from "@/i18n/LocaleProvider";
import ProcessCursorVideo from "@/components/hero/ProcessCursorVideo";
import VideoSlot from "@/components/media/VideoSlot";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/** Video paths only — step titles/copy come from the dictionary and are
 *  joined by index. */
const STEP_VIDEOS = [
  "/videos/process-discover.mp4",
  "/videos/process-shape.mp4",
  "/videos/process-build.mp4",
  "/videos/process-launch.mp4",
];

/**
 * Desktop (>=980px): GSAP ScrollTrigger pins the section and scrubs the
 * active-step highlight across the 4 panels as the user scrolls.
 * Mobile: no pin attempt (touch-scroll pinning is jitter-prone) — the same
 * 4 steps render as a plain sequential whileInView reveal via <Reveal>.
 */
export default function ProcessTimeline() {
  const t = useTranslations();
  const steps = t.process.steps.map((step, i) => ({ ...step, video: STEP_VIDEOS[i] }));
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reducedMotion = usePrefersReducedMotion();
  // Desktop-pin-driven active step, for the per-step background video.
  // undefined until the pin engages (mobile / reduced-motion never set
  // this), matching Hero's phonePhase pattern.
  const [activeIndex, setActiveIndex] = useState<number | undefined>(undefined);

  useGSAP(
    () => {
      if (reducedMotion) return;
      const mm = gsap.matchMedia();

      mm.add("(min-width: 980px)", () => {
        const steps = stepRefs.current.filter(Boolean) as HTMLDivElement[];
        if (!steps.length || !sectionRef.current) return;

        gsap.set(steps, { opacity: 0.35, "--progress": 0 });
        gsap.set(steps[0], { opacity: 1 });
        setActiveIndex(0);

        // Throttled to at most once per rendered frame via requestAnimationFrame,
        // same reasoning as Hero's phonePhase sync: calling setState directly
        // from ScrollTrigger's onUpdate (which fires many times per scroll
        // gesture during the scrub) forces a React render pass that often,
        // stacked on GSAP's own tween work, causes visible scroll jank.
        let lastActive = 0;
        let activeRaf = 0;
        const syncActive = () => {
          activeRaf = 0;
          const t = tl.time();
          const index = Math.min(steps.length - 1, Math.max(0, Math.round(t)));
          if (index !== lastActive) {
            lastActive = index;
            setActiveIndex(index);
          }
        };

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: `+=${steps.length * 360}`,
            scrub: 0.6,
            pin: true,
            pinType: "transform",
            anticipatePin: 1,
            onUpdate: () => {
              if (!activeRaf) activeRaf = requestAnimationFrame(syncActive);
            },
          },
        });

        steps.forEach((step, index) => {
          const start = index;
          tl.to(step, { opacity: 1, "--progress": 1, duration: 0.7, ease: "none" }, start);
          if (index > 0) {
            tl.to(steps[index - 1], { opacity: 0.35, duration: 0.7, ease: "none" }, start);
          }
        });

        return () => {
          if (activeRaf) cancelAnimationFrame(activeRaf);
          tl.scrollTrigger?.kill();
          tl.kill();
          setActiveIndex(undefined);
        };
      });
    },
    // revertOnUpdate: true — without this, @gsap/react only reverts its
    // GSAP context on unmount, not when `dependencies` change, so flipping
    // reducedMotion false→true (which usePrefersReducedMotion always does
    // once, shortly after mount) re-runs this callback and hits the early
    // return without ever cleaning up the pin the first (false) run made.
    { scope: sectionRef, dependencies: [reducedMotion], revertOnUpdate: true }
  );

  const activeStep = steps[activeIndex ?? 0];

  return (
    <section className="section section-vivid section-vivid-process process-section process-cursor-active" id="process" ref={sectionRef}>
      <ProcessCursorVideo src={activeStep.video} label={activeStep.title} containerRef={sectionRef} />
      <div className="wrap">
        <Reveal className="section-head">
          <div>
            <span className="section-kicker">{t.process.kicker}</span>
            <h2>{t.process.title}</h2>
          </div>
          <p className="section-lead">{t.process.lead}</p>
        </Reveal>

        <div className="process">
          {steps.map((step, index) => (
            <Reveal
              as="article"
              key={step.title}
              delay={index * 0.08}
              className="process-step glass"
            >
              <div
                className="process-step-inner"
                ref={(el) => {
                  stepRefs.current[index] = el;
                }}
              >
                {/* Mobile only (see CSS): the desktop cursor-puck has no
                    touch equivalent, so each card plays its own step video
                    as a background instead — always-on, not pointer-driven. */}
                <div className="process-step-mobile-video" aria-hidden="true">
                  <VideoSlot src={step.video} fallback={null} className="process-step-mobile-video-slot" loop />
                  <div className="process-step-mobile-video-scrim" />
                </div>
                <span className="process-step-number">{`0${index + 1}`}</span>
                <div className="process-step-track"><span className="process-step-fill" /></div>
                <h3>{step.title}</h3>
                <p>{step.copy}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
