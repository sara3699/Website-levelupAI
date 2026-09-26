import { forwardRef, type CSSProperties } from "react";
import HeroScreenPanel from "./panels/HeroScreenPanel";
import ServicesScreenPanel from "./panels/ServicesScreenPanel";
import WorkShowcaseScreenPanel from "./panels/WorkShowcaseScreenPanel";

type ScreenPreviewTrackProps = {
  style?: CSSProperties;
};

/**
 * Absolutely-positioned inner track, 3x the laptop screen's height,
 * containing the 3 preview panels stacked in normal flow. The parent
 * (DeviceMockup) clips this via `.laptop-screen { overflow: hidden }` and
 * a GSAP-driven `yPercent` tween pans it — this component itself owns no
 * scroll logic, purely structural, so it's independently visually
 * verifiable before any GSAP wiring exists.
 */
const ScreenPreviewTrack = forwardRef<HTMLDivElement, ScreenPreviewTrackProps>(
  function ScreenPreviewTrack({ style }, ref) {
    return (
      <div className="laptop-screen-track" ref={ref} style={style}>
        <HeroScreenPanel />
        <ServicesScreenPanel />
        <WorkShowcaseScreenPanel />
      </div>
    );
  }
);

export default ScreenPreviewTrack;
