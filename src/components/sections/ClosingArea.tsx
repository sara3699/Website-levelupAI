import type { ReactNode } from "react";
import CinematicBackground from "@/components/media/CinematicBackground";

/**
 * The page's closing stretch: FAQ and Contact on one shared background.
 *
 * This is Contact's original background, moved up one level rather than
 * copied: the same starry video, the same dark base colour and the same
 * scrim (see `.closing-area` in globals.css). Rendering it once, on a
 * wrapper around both sections, is what makes the two read as a single
 * area with no seam and no second copy of the video.
 */
export default function ClosingArea({ children }: { children: ReactNode }) {
  return (
    <div className="closing-area">
      <CinematicBackground variant="contact" src="/videos/contact-bg.mp4" />
      {children}
    </div>
  );
}
