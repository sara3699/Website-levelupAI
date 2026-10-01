"use client";

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Reveal from "@/components/ui/Reveal";
import { useTranslations } from "@/i18n/LocaleProvider";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Desktop (>=980px): GSAP ScrollTrigger pins the section and scrubs the
 * active-step highlight across the 4 panels as the user scrolls.
 * Mobile: no pin attempt (touch-scroll pinning is jitter-prone) — the same
 * 4 steps render as a plain sequential whileInView reveal via <Reveal>.
 */
export default function ProcessTimeline() {
  const t = useTranslations();
  const steps = t.process.steps;
  const sectionRef = useRef<HTMLDivElement>(null);
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);
  const reducedMotion = usePrefersReducedMotion();

  useGSAP(
    () => {
      if (reducedMotion) return;
      const mm = gsap.matchMedia();

      mm.add("(min-width: 980px)", () => {
        const steps = stepRefs.current.filter(Boolean) as HTMLDivElement[];
        if (!steps.length || !sectionRef.current) return;

        gsap.set(steps, { opacity: 0.35, "--progress": 0 });
        gsap.set(steps[0], { opacity: 1 });

        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top top",
            end: `+=${steps.length * 360}`,
            scrub: 0.6,
            pin: true,
            pinType: "transform",
            anticipatePin: 1,
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
          tl.scrollTrigger?.kill();
          tl.kill();
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

  // The video puck that replaced the mouse pointer here (ProcessCursorVideo)
  // and the per-card step videos on phones were removed on 2026-09-25 at
  // Sarra's request: the section keeps the site's normal cursor, and the
  // cards use the packs' neon look.
  return (
    <section className="section section-vivid section-vivid-process process-section" id="process" ref={sectionRef}>
      <div className="wrap">
        <Reveal className="section-head">
          <div>
            <span className="section-kicker">{t.process.kicker}</span>
            <h2>{t.process.title}</h2>
          </div>
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
