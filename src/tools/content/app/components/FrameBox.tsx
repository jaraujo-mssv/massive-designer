import { forwardRef, type ReactNode } from "react";

/**
 * A frame at true video size, shown smaller by a CSS transform.
 *
 * Frames are authored in real pixels (1080×1920 or 1920×1080), so they're drawn
 * full size and scaled, never laid out small. The ref lands on the inner,
 * unscaled node, which is what the PNG export renders; the export turns the
 * transform off, so `scale` never changes an exported file.
 *
 * The outer box is floored to whole pixels, so a fractional size can't start
 * a resize loop.
 */
export const FrameBox = forwardRef<
  HTMLDivElement,
  { w: number; h: number; scale: number; className?: string; children: ReactNode }
>(function FrameBox({ w, h, scale, className = "", children }, ref) {
  return (
    <div className={`overflow-hidden ${className}`} style={{ width: Math.floor(w * scale), height: Math.floor(h * scale) }}>
      <div ref={ref} style={{ position: "relative", width: w, height: h, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        {children}
      </div>
    </div>
  );
});
