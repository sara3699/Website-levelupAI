"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import GlassCard from "@/components/ui/GlassCard";
import Reveal from "@/components/ui/Reveal";
import { useTranslations } from "@/i18n/LocaleProvider";
import { interpolate } from "@/i18n/dictionaries";

/** label/title live in the dictionaries, keyed by id. */
type ClipId = "mascara" | "grape-beauty" | "eyeshadow" | "lumea" | "jewel";

type Clip = {
  id: ClipId;
  src: string;
  orientation: "landscape" | "portrait";
};

const CLIPS: Clip[] = [
 { id: "jewel", src: "/videos/new/5.mp4", orientation: "landscape" },
  { id: "grape-beauty", src: "/videos/new/15.mp4", orientation: "portrait" },
  { id: "eyeshadow", src: "/videos/new/3.mp4", orientation: "portrait" },
  { id: "lumea", src: "/videos/new/16.mp4", orientation: "portrait" },
    { id: "mascara", src: "/videos/new/1.mp4", orientation: "portrait" },
 
];

const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_DRAMATIC: [number, number, number, number] = [0.76, 0, 0.24, 1];

/**
 * Reels-style showcase of real AI-generated commercial clips — the proof
 * behind the "AI commercial videos" claim made elsewhere on the site.
 * Cards autoplay muted/looping like a normal grid; clicking one opens a
 * focused lightbox and plays that single clip with real audio (a real
 * click, so the browser allows it), while every other card's video pauses
 * so nothing keeps burning bandwidth/CPU behind the modal.
 */
export default function AICommercials() {
  const t = useTranslations();
  const [activeId, setActiveId] = useState<string | null>(null);
  const cardVideoRefs = useRef<Record<string, HTMLVideoElement | null>>({});
  const modalVideoRef = useRef<HTMLVideoElement | null>(null);

  const activeIndex = activeId ? CLIPS.findIndex((clip) => clip.id === activeId) : -1;
  const activeClip = activeIndex >= 0 ? CLIPS[activeIndex] : null;

  function openClip(id: string) {
    Object.values(cardVideoRefs.current).forEach((video) => video?.pause());
    setActiveId(id);
  }

  function closeClip() {
    modalVideoRef.current?.pause();
    setActiveId(null);
    // Resume the grid's muted thumbnails once the modal's gone.
    Object.values(cardVideoRefs.current).forEach((video) => {
      video?.play().catch(() => {});
    });
  }

  function step(delta: number) {
    if (activeIndex < 0) return;
    const next = (activeIndex + delta + CLIPS.length) % CLIPS.length;
    setActiveId(CLIPS[next].id);
  }

  useEffect(() => {
    if (!activeClip) return;
    const video = modalVideoRef.current;
    if (video) {
      video.currentTime = 0;
      video.muted = false;
      video.volume = 1;
      video.play().catch(() => {
        // Autoplay-with-sound can still be refused in rare cases (e.g. a
        // browser that doesn't treat the triggering click as recent enough
        // once React finishes re-rendering) — fall back to a muted loop
        // rather than a frozen frame.
        video.muted = true;
        video.play();
      });
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeClip();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }
    window.addEventListener("keydown", onKeyDown);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.documentElement.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
    <section className="section section-vivid section-vivid-reels ai-commercials" id="ai-commercials">
      <div className="wrap">
        <Reveal className="section-head">
          <div>
            <span className="section-kicker">{t.commercials.kicker}</span>
            <h2>{t.commercials.title}</h2>
          </div>
          <p className="section-lead">
            {t.commercials.lead}
          </p>
        </Reveal>

        <div className="ai-commercials-grid">
          {CLIPS.map((clip, index) => (
            <Reveal key={clip.id} delay={index * 0.07} className={`ai-commercials-cell ai-commercials-cell-${clip.orientation}`}>
              <GlassCard
                className="ai-commercials-card"
                tilt={false}
                style={{ cursor: "pointer" }}
              >
                <button
                  type="button"
                  className="ai-commercials-trigger"
                  onClick={() => openClip(clip.id)}
                  aria-label={interpolate(t.commercials.playWithSound, { title: t.commercials.clips[clip.id].title })}
                >
                  <video
                    ref={(el) => {
                      cardVideoRefs.current[clip.id] = el;
                    }}
                    className="ai-commercials-thumb"
                    src={clip.src}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="metadata"
                  />
                  <span className="ai-commercials-scrim" aria-hidden="true" />
                  <span className="ai-commercials-meta">
                    <span className="ai-commercials-label">{t.commercials.clips[clip.id].label}</span>
                    <span className="ai-commercials-title">{t.commercials.clips[clip.id].title}</span>
                  </span>
                  <span className="ai-commercials-play" aria-hidden="true">
                    <svg viewBox="0 0 24 24" width="20" height="20">
                      <path d="M8 5v14l11-7Z" fill="currentColor" />
                    </svg>
                  </span>
                </button>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {activeClip && (
          <motion.div
            className="ai-commercials-lightbox"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: EASE_OUT }}
            onClick={closeClip}
          >
            <motion.div
              className={`ai-commercials-lightbox-frame ai-commercials-lightbox-frame-${activeClip.orientation}`}
              initial={{ opacity: 0, scale: 0.85, filter: "blur(18px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.88, filter: "blur(14px)" }}
              transition={{ duration: 0.5, ease: EASE_DRAMATIC }}
              onClick={(event) => event.stopPropagation()}
            >
              <video
                key={activeClip.id}
                ref={modalVideoRef}
                className="ai-commercials-lightbox-video"
                src={activeClip.src}
                playsInline
                loop
                controls={false}
              />
              <div className="ai-commercials-lightbox-caption">
                <span className="ai-commercials-label">{t.commercials.clips[activeClip.id].label}</span>
                <span className="ai-commercials-title">{t.commercials.clips[activeClip.id].title}</span>
              </div>
            </motion.div>

            <button type="button" className="ai-commercials-nav ai-commercials-nav-prev" onClick={(e) => { e.stopPropagation(); step(-1); }} aria-label={t.commercials.previous}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.3}><path d="M15 6 9 12l6 6" /></svg>
            </button>
            <button type="button" className="ai-commercials-nav ai-commercials-nav-next" onClick={(e) => { e.stopPropagation(); step(1); }} aria-label={t.commercials.next}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth={2.3}><path d="m9 6 6 6-6 6" /></svg>
            </button>
            <button type="button" className="ai-commercials-close" onClick={closeClip} aria-label={t.commercials.close}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2.3}><path d="M6 6l12 12M18 6 6 18" /></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
