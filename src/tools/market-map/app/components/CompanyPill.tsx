import { useState } from "react";
import { InitialsLogo, initialsColor } from "@/shared/canvas/logos/InitialsLogo";
import { useResolvedLogo } from "@/shared/canvas/logos/resolve";
import type { PillMetrics } from "../utils/pills";
import { PILL_WEIGHT } from "../utils/pills";

/**
 * How strongly the blurred logo colours the pill. Set per theme as
 * --canvas-pill-wash-opacity (theme-canvas.css); this is the fallback.
 */
const LOGO_WASH_OPACITY = 0.18;

interface CompanyPillProps {
  name: string;
  logoUrl: string;
  /** The company's website, to look up a logo when its own doesn't work. */
  website?: string;
  x: number;
  y: number;
  width: number;
  metrics: PillMetrics;
  /** A "+N more" pill for companies hidden to fit: text only, no logo or wash. */
  more?: boolean;
  /** Click-to-edit; gets the pill to anchor the popover on. */
  onClick?: (el: HTMLElement) => void;
}

/**
 * A company as a pill: logo then name, tinted by a blurred copy of its logo.
 * The logo is the best one found (useResolvedLogo); without one, an initials
 * logo, and the pill is tinted in its colour.
 */
export function CompanyPill({ name, logoUrl, website, x, y, width, metrics: m, more = false, onClick }: CompanyPillProps) {
  const editable = onClick
    ? { className: "canvas-editable", onClick: (e: React.MouseEvent<HTMLElement>) => onClick(e.currentTarget) }
    : {};
  const resolved = useResolvedLogo(more ? "" : logoUrl, more ? undefined : website);
  // A logo that still fails to draw shows initials until the lookup settles on another.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = resolved && resolved !== failedSrc ? resolved : null;
  // Blur scales with the pill, so small pills still get a smooth wash, not a smudged logo.
  const washBlur = Math.max(8, m.height * 0.5);

  if (more) {
    return (
      <div
        title={name}
        {...editable}
        style={{
          position: "absolute",
          left: x,
          top: y,
          width,
          height: m.height,
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: `${m.padY}px ${m.padX}px`,
          borderRadius: 999,
          backgroundColor: "var(--canvas-pill-bg)",
          color: "var(--canvas-text-85)",
          fontSize: m.fontSize,
          fontWeight: PILL_WEIGHT,
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        {name}
      </div>
    );
  }

  return (
    <div
      title={name}
      {...editable}
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        height: m.height,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: m.innerGap,
        padding: `${m.padY}px ${m.padX}px`,
        borderRadius: 999,
        backgroundColor: "var(--canvas-pill-bg)",
        color: "var(--canvas-text)",
        fontSize: m.fontSize,
        fontWeight: PILL_WEIGHT,
        lineHeight: 1,
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {/* Logo wash: the logo as a square centred on the pill, as wide as the pill,
          heavily blurred and faded. Blur fades out at an image's edges, so the image
          overhangs by twice the blur and the pill clips it. The logo and name below
          are position: relative so they paint above it. */}
      {src ? (
        <img
          aria-hidden
          alt=""
          src={src}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: width + washBlur * 4,
            height: width + washBlur * 4,
            transform: "translate(-50%, -50%)",
            objectFit: "cover",
            objectPosition: "center",
            filter: `blur(${washBlur}px) saturate(1.4)`,
            opacity: `var(--canvas-pill-wash-opacity, ${LOGO_WASH_OPACITY})`,
            pointerEvents: "none",
          }}
        />
      ) : (
        // No logo: tint the pill in the initials logo's colour instead.
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: initialsColor(name),
            opacity: `var(--canvas-pill-wash-opacity, ${LOGO_WASH_OPACITY})`,
            pointerEvents: "none",
          }}
        />
      )}
      {src ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailedSrc(src)}
          style={{ position: "relative", width: m.logo, height: m.logo, objectFit: "contain", flexShrink: 0, borderRadius: 4 }}
        />
      ) : (
        <InitialsLogo name={name} size={m.logo} />
      )}
      <span style={{ position: "relative" }}>{name}</span>
    </div>
  );
}
