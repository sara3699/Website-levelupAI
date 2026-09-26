"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import VideoSlot from "@/components/media/VideoSlot";
import GlassCard from "@/components/ui/GlassCard";
import Reveal from "@/components/ui/Reveal";
import { useTranslations } from "@/i18n/LocaleProvider";
import { interpolate } from "@/i18n/dictionaries";

/** Labels live in the dictionaries, keyed by id. (These were previously
 *  hardcoded in French even on the English site — the EN dictionary now
 *  carries proper English for them.) */
const CARDS = [
  { id: "clip-7", src: "/videos/new/7.mp4", rotate: -3 },
  { id: "clip-8", src: "/videos/new/13.mp4", rotate: 2 },
  { id: "clip-9", src: "/videos/new/12.mp4", rotate: -1.5 },
  { id: "clip-10", src: "/videos/new/10.mp4", rotate: 3 },
] as const;

/**
 * Horizontal scroll-snap track of mood/style reference clips — native touch
 * scroll on mobile, an optional pointer-drag-to-scroll enhancement on
 * desktop (gated inside an effect, pointer:fine only, so it never fights
 * native scrollLeft as the single source of truth).
 */
/** Pointer travel (px) past which a press counts as a drag, not a click. */
const DRAG_THRESHOLD = 6;

export default function VideoCarousel() {
  const t = useTranslations();
  const trackRef = useRef<HTMLDivElement>(null);
  const lightboxVideoRef = useRef<HTMLVideoElement>(null);
  const [activeCard, setActiveCard] = useState<(typeof CARDS)[number] | null>(null);
  // Distance the pointer travelled during the last press. The track is
  // drag-to-scroll, so a release that moved more than a few pixels is a drag,
  // not a click, and must not open the lightbox.
  const dragDistance = useRef(0);

  // Reset on every press, on any pointer type. The drag-scroll effect below
  // is desktop-only, so resetting inside it would leave a stale distance on
  // touch devices and permanently block opening a card.
  function resetDrag() {
    dragDistance.current = 0;
  }

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    if (!finePointer) return;

    const track = trackRef.current;
    if (!track) return;

    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;

    function onPointerDown(event: PointerEvent) {
      isDown = true;
      startX = event.clientX;
      startScrollLeft = track!.scrollLeft;
    }
    function onPointerMove(event: PointerEvent) {
      if (!isDown) return;
      const delta = event.clientX - startX;
      dragDistance.current = Math.max(dragDistance.current, Math.abs(delta));
      // Only hijack scrolling once the gesture is clearly a drag; below the
      // threshold the press stays a click, and capturing the pointer here
      // would swallow the click event the card needs to open.
      if (dragDistance.current <= DRAG_THRESHOLD) return;
      track!.scrollLeft = startScrollLeft - delta;
    }
    function onPointerUp() {
      isDown = false;
    }

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointercancel", onPointerUp);

    return () => {
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  // Ask for real fullscreen once the clip mounts. Browsers only grant this
  // inside a user gesture; the click that set activeCard qualifies. If it's
  // refused (iOS Safari doesn't allow it on <video> without its own control,
  // and permissions policies can block it) the styled overlay below is
  // already a full-viewport view, so the experience degrades cleanly.
  useEffect(() => {
    if (!activeCard) return;
    const video = lightboxVideoRef.current;
    if (!video) return;
    const request =
      video.requestFullscreen?.bind(video) ??
      (video as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen?.bind(video);
    try {
      const result = request?.();
      if (result instanceof Promise) result.catch(() => {});
    } catch {
      /* Overlay fallback already covers the viewport. */
    }
  }, [activeCard]);

  // Leaving fullscreen (Esc, the native control, swipe-down on iOS) should
  // also dismiss the overlay, otherwise the page is left showing a modal the
  // user already closed.
  useEffect(() => {
    if (!activeCard) return;
    function onFullscreenChange() {
      if (!document.fullscreenElement) setActiveCard(null);
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, [activeCard]);

  // Close on Escape, and freeze the page behind the lightbox so scrolling
  // the overlay doesn't scroll the carousel underneath it.
  useEffect(() => {
    if (!activeCard) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveCard(null);
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      // Dismissing via the overlay's own X/backdrop leaves the browser still
      // in fullscreen; exit it so the page isn't stranded there.
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    };
  }, [activeCard]);

  const openCard = useCallback((card: (typeof CARDS)[number]) => {
    // Suppress the click that ends a drag-scroll.
    if (dragDistance.current > DRAG_THRESHOLD) return;
    setActiveCard(card);
  }, []);

  return (
    <section className="section section-vivid section-vivid-carousel video-carousel-section">
      <div className="wrap">
        <Reveal className="section-head">
          <div>
            <span className="section-kicker">{t.carousel.kicker}</span>
            <h2>{t.carousel.title}</h2>
          </div>
          <p className="section-lead">
            {t.carousel.lead}
          </p>
        </Reveal>
      </div>

      <div className="video-carousel-track" ref={trackRef}>
        {/* Whole card is the click target — clicking the clip opens it.
            role/tabIndex keep it keyboard-reachable without a visible
            button, since the design calls for the bare video. */}
        {CARDS.map((card) => (
          <div
            key={card.id}
            className="video-carousel-card"
            style={{ "--card-rotate": `${card.rotate}deg` } as React.CSSProperties}
            role="button"
            tabIndex={0}
            aria-label={interpolate(t.carousel.playWithSound, { label: t.carousel.labels[card.id] })}
            onPointerDown={resetDrag}
            onClick={() => openCard(card)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                openCard(card);
              }
            }}
          >
            <GlassCard className="video-carousel-glass" tilt={false}>
              <span className="video-carousel-label">{t.carousel.labels[card.id]}</span>
              <VideoSlot
                className="video-carousel-video-slot"
                src={card.src}
                fallback={<div className="video-carousel-fallback" />}
              />
            </GlassCard>
          </div>
        ))}
      </div>

      <AnimatePresence>
        {activeCard && (
          <motion.div
            className="video-lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={t.carousel.labels[activeCard.id]}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={() => setActiveCard(null)}
          >
            <motion.div
              className="video-lightbox-frame"
              initial={{ scale: 0.94, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 8 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              onClick={(event) => event.stopPropagation()}
            >
              {/* Not muted and not autoPlay-gated: this element only exists
                  after a user click, which satisfies every browser's
                  gesture requirement for playing audio. */}
              <video
                key={activeCard.src}
                ref={lightboxVideoRef}
                className="video-lightbox-video"
                src={activeCard.src}
                controls
                autoPlay
                playsInline
                loop
              />
            </motion.div>
            <button
              type="button"
              className="video-lightbox-close"
              onClick={() => setActiveCard(null)}
              aria-label={t.carousel.close}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
