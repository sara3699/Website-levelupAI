"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useTransform, type MotionValue } from "framer-motion";
import { useTranslations } from "@/i18n/LocaleProvider";


const CYCLE_MS = 2800;

type AutomationPhoneProps = {
  tiltX: MotionValue<number>;
  tiltY: MotionValue<number>;
  /** When provided (desktop, scroll-synced to the hero pin), this drives
   * which notification shows instead of the internal timer. When omitted
   * (mobile, or reduced-motion desktop), the component times itself. */
  activeIndex?: number;
};

/**
 * Glowing phone mockup with a notification cycle. Index starts at 0
 * unconditionally (identical on server and first client paint) — the
 * interval that advances it (when uncontrolled) only starts inside an
 * effect, and only if the user hasn't asked for reduced motion.
 */
export default function AutomationPhone({ tiltX, tiltY, activeIndex: controlledIndex }: AutomationPhoneProps) {
  const t = useTranslations();
  const notifications = t.phone.notifications;
  const [internalIndex, setInternalIndex] = useState(0);
  const isControlled = controlledIndex !== undefined;
  const count = notifications.length;

  useEffect(() => {
    if (isControlled) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;

    const interval = window.setInterval(() => {
      setInternalIndex((current) => (current + 1) % count);
    }, CYCLE_MS);

    return () => window.clearInterval(interval);
  }, [isControlled, count]);

  const rotateY = useTransform(tiltX, [-1, 1], [-9, 9]);
  const rotateX = useTransform(tiltY, [-1, 1], [6, -6]);
  const translateX = useTransform(tiltX, [-1, 1], [-14, 14]);

  const activeIndex = isControlled ? controlledIndex : internalIndex;
  const active = notifications[activeIndex];

  return (
    <motion.div
      className="automation-phone glass"
      style={{
        rotate: -6,
        rotateX,
        rotateY,
        x: translateX,
        translateZ: 50,
      }}
    >
      <div className="automation-phone-glow" aria-hidden="true" />
      <div className="automation-phone-screen">
        <div className="automation-phone-header">
          <span>{t.phone.header}</span>
          <span className="live">● {t.phone.live}</span>
        </div>
        <div className="automation-phone-stack">
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.div
              key={activeIndex}
              className="automation-phone-toast"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <span className="automation-phone-toast-label">{active.label}</span>
              <strong className="automation-phone-toast-title">{active.title}</strong>
              <span className="automation-phone-toast-detail">{active.detail}</span>
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="automation-phone-dots">
          {notifications.map((notification, index) => (
            <span
              key={notification.label}
              className={index === activeIndex ? "dot dot-active" : "dot"}
            />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
