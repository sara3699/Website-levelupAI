"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import ScreenPreviewTrack from "./ScreenPreviewTrack";

type DeviceMockupProps = {
  tiltX: MotionValue<number>;
  tiltY: MotionValue<number>;
  trackRef?: React.Ref<HTMLDivElement>;
};

/**
 * A large, tilted laptop mockup. The chassis (this component) owns cursor
 * tilt only (Framer, on this outer transformed layer). The screen's inner
 * content pan is owned by a separate GSAP-driven layer (ScreenPreviewTrack,
 * targeted via trackRef from the parent) — the two never share a
 * transformed element, so tilt and scroll-pan compose without fighting.
 */
export default function DeviceMockup({ tiltX, tiltY, trackRef }: DeviceMockupProps) {
  const rotateY = useTransform(tiltX, [-1, 1], [-6, 6]);
  const rotateX = useTransform(tiltY, [-1, 1], [4, -4]);

  return (
    <div className="laptop-stage">
      <motion.div
        className="laptop-tilt"
        style={{ rotateX, rotateY, transformPerspective: 1600 }}
      >
        <div className="laptop-screen-panel glass">
          <div className="laptop-notch" />
          <div className="laptop-screen">
            <ScreenPreviewTrack ref={trackRef} />
          </div>
        </div>
        <div className="laptop-hinge" />
        <div className="laptop-base" />
      </motion.div>
    </div>
  );
}
