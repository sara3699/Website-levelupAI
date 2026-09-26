"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import VideoSlot from "./VideoSlot";
import VideoRipple from "./VideoRipple";
import { useParallaxY } from "@/hooks/useParallaxY";
import { useUnmutableVideo } from "@/hooks/useUnmutableVideo";
import { useTranslations } from "@/i18n/LocaleProvider";

type Variant = "hero" | "services" | "process" | "contact";

type CinematicBackgroundProps = {
  variant: Variant;
  src?: string;
  /** Alternate clip for narrow/mobile viewports — see VideoSlot. */
  mobileSrc?: string;
  poster?: string;
  className?: string;
  parallax?: boolean;
  priority?: boolean;
  /** Applies the cursor-driven WebGL ripple + chromatic-aberration shader
   * on top of the video. Desktop-only, gated inside VideoRipple itself. */
  ripple?: boolean;
  /** Attempts audible playback on mount, falling back to muted autoplay
   * when the browser refuses, and renders a persistent mute/unmute
   * control — see useUnmutableVideo for the full ladder. */
  sound?: boolean;
};

const VARIANT_FALLBACK: Record<Variant, React.ReactNode> = {
  hero: (
    <>
      <div className="cine-glow cine-glow-gold" />
      <div className="cine-glow cine-glow-bronze" />
      <div className="cine-grain" />
    </>
  ),
  services: (
    <>
      <div className="cine-glow cine-glow-champagne" />
      <div className="cine-grain" />
    </>
  ),
  process: (
    <>
      <div className="cine-glow cine-glow-gold cine-glow-soft" />
      <div className="cine-grain" />
    </>
  ),
  contact: (
    <>
      <div className="cine-glow cine-glow-bronze" />
      <div className="cine-glow cine-glow-gold cine-glow-soft" />
      <div className="cine-grain" />
    </>
  ),
};

/** Mute/unmute toggle for a CinematicBackground with `sound` enabled.
 * Rendered as a sibling of .cine-bg (not a descendant) — .cine-bg sits at
 * z-index:-1 inside its section's own isolated stacking context (see
 * `.hero { isolation: isolate }`), so nothing nested inside it can ever
 * paint — or receive clicks — above the section's normal-flow content,
 * regardless of its own z-index. The button has to live outside that
 * subtree entirely to be clickable over the hero copy/laptop.
 *
 * It stays mounted in both states — it used to unmount the moment sound
 * started, which left the visitor no way back to silence and made the
 * control row jump. `aria-pressed` carries the state, so the label
 * describes the action the press performs. */
function SoundButton({ unmuted, onClick }: { unmuted: boolean; onClick: () => void }) {
  const t = useTranslations();
  return (
    <button
      type="button"
      className="video-slot-sound"
      onClick={onClick}
      aria-pressed={unmuted}
      aria-label={unmuted ? t.media.muteSound : t.media.playWithSound}
    >
      <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
        <path
          d="M4 9v6h4l5 4V5L8 9H4Z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
        {unmuted ? (
          <path
            d="M16 8.5a4.5 4.5 0 0 1 0 7M18.5 5.5a8.5 8.5 0 0 1 0 13"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        ) : (
          <path
            d="M16.5 9.5l5 5M21.5 9.5l-5 5"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        )}
      </svg>
      <span>{unmuted ? t.media.soundOff : t.media.soundOn}</span>
    </button>
  );
}

function ParallaxLayer({
  variant,
  src,
  mobileSrc,
  poster,
  className,
  priority,
  ripple,
  sound,
}: Omit<CinematicBackgroundProps, "parallax">) {
  const { ref, y } = useParallaxY(60);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const { attachVideo, unmuted, toggleSound } = useUnmutableVideo();

  return (
    <>
      <motion.div ref={ref} className={clsx("cine-bg", `cine-bg-${variant}`, className)} style={{ y }}>
        <VideoSlot
          src={src}
          mobileSrc={mobileSrc}
          poster={poster}
          fallback={VARIANT_FALLBACK[variant]}
          className="cine-bg-video-slot"
          priority={priority}
          unmuted={unmuted}
          videoRef={(el) => {
            attachVideo(el);
            if (ripple) setVideoEl(el);
          }}
        />
        {ripple && <VideoRipple video={videoEl} />}
      </motion.div>
      {sound && <SoundButton unmuted={unmuted} onClick={toggleSound} />}
    </>
  );
}

function StaticLayer({
  variant,
  src,
  mobileSrc,
  poster,
  className,
  priority,
  ripple,
  sound,
}: Omit<CinematicBackgroundProps, "parallax">) {
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const { attachVideo, unmuted, toggleSound } = useUnmutableVideo();

  return (
    <>
      <div className={clsx("cine-bg", `cine-bg-${variant}`, className)}>
        <VideoSlot
          src={src}
          mobileSrc={mobileSrc}
          poster={poster}
          fallback={VARIANT_FALLBACK[variant]}
          className="cine-bg-video-slot"
          priority={priority}
          unmuted={unmuted}
          videoRef={(el) => {
            attachVideo(el);
            if (ripple) setVideoEl(el);
          }}
        />
        {ripple && <VideoRipple video={videoEl} />}
      </div>
      {sound && <SoundButton unmuted={unmuted} onClick={toggleSound} />}
    </>
  );
}

/**
 * When `parallax` is false (e.g. the hero background, which now lives
 * inside a GSAP-pinned section — a scroll-linked `y` drift on the whole
 * layer fights the pin, since the pin holds the layer's viewport position
 * fixed while useParallaxY's independent useScroll tracking keeps
 * computing as if it were moving), this renders a completely separate,
 * non-parallax component rather than conditionally skipping the ref on a
 * shared one. useParallaxY's useScroll({ target: ref }) call is not
 * conditional internally — attaching that hook but never attaching its
 * ref to a DOM node (which the old `ref={parallax ? ref : undefined}`
 * pattern did) left Framer Motion watching a ref that's never hydrated,
 * producing a console warning on every render.
 */
export default function CinematicBackground({ parallax = true, ...props }: CinematicBackgroundProps) {
  return parallax ? <ParallaxLayer {...props} /> : <StaticLayer {...props} />;
}
