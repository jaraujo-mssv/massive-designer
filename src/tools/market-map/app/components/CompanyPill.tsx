import { useState } from "react";
import type { PillMetrics } from "../utils/pills";
import { PILL_WEIGHT } from "../utils/pills";

/**
 * How strongly the blurred logo colours the pill. Set per theme as
 * --canvas-pill-wash-opacity (theme-canvas.css); this is the fallback.
 */
const LOGO_WASH_OPACITY = 0.25;

interface CompanyPillProps {
  name: string;
  logoUrl: string;
  x: number;
  y: number;
  width: number;
  metrics: PillMetrics;
  /** A "+N more" pill for companies hidden to fit: text only, no logo or wash. */
  more?: boolean;
}

/** A company as a pill: logo then name, tinted by a blurred copy of its logo. */
export function CompanyPill({ name, logoUrl, x, y, width, metrics: m, more = false }: CompanyPillProps) {
  const [logoFailed, setLogoFailed] = useState(!logoUrl);
  // Blur scales with the pill, so small pills still get a smooth wash, not a smudged logo.
  const washBlur = Math.max(8, m.height * 0.5);

  if (more) {
    return (
      <div
        title={name}
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
          color: "var(--canvas-text-70)",
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
      {!logoFailed && (
        <img
          aria-hidden
          alt=""
          src={logoUrl}
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
      )}
      {logoFailed ? (
        <span
          style={{
            position: "relative",
            width: m.logo,
            height: m.logo,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: m.logo * 0.6,
            fontWeight: 700,
            color: "var(--canvas-text-dim)",
          }}
        >
          {name.charAt(0).toUpperCase()}
        </span>
      ) : (
        <img
          src={logoUrl}
          alt={name}
          onError={() => setLogoFailed(true)}
          style={{ position: "relative", width: m.logo, height: m.logo, objectFit: "contain", flexShrink: 0, borderRadius: 4 }}
        />
      )}
      <span style={{ position: "relative" }}>{name}</span>
    </div>
  );
}
