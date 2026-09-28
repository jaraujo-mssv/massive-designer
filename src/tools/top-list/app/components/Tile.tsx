import { useState } from "react";
import type { Rect } from "@/shared/canvas/squarify";
import { NAME_WEIGHT, VALUE_WEIGHT, tileContent } from "../utils/tiers";

/** How strongly the blurred logo colours the tile. */
const LOGO_WASH_OPACITY = 0.25;

interface TileProps {
  rect: Rect;
  name: string;
  logoUrl: string;
  /** Formatted value (bento), or null for grid tiles. */
  value: string | null;
  /** Rank shown in the top-left corner (grid tiles). */
  rank?: number;
  /**
   * Size to fit the content to, when it should differ from the tile's own:
   * grid tiles all use a regular tile's size, so every row looks the same.
   */
  sizing?: { w: number; h: number };
}

export function Tile({ rect, name, logoUrl, value, rank, sizing = rect }: TileProps) {
  const [logoFailed, setLogoFailed] = useState(!logoUrl);
  const c = tileContent(sizing.w, sizing.h, name, value, rank !== undefined, rect.w);
  // Blur scales with the tile, so every tile gets a smooth wash, not a smudged logo.
  const washBlur = Math.min(80, Math.max(24, Math.min(rect.w, rect.h) * 0.18));

  return (
    <div
      title={value ? `${name} · ${value}` : name}
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        backgroundColor: "var(--canvas-card-bg)",
        border: "2px solid var(--canvas-border-15)",
        borderRadius: 6,
        boxSizing: "border-box",
        padding: c.padding,
        display: "flex",
        flexDirection: c.horizontal ? "row" : "column",
        alignItems: "center",
        justifyContent: "center",
        gap: c.gap,
        overflow: "hidden",
        fontFamily: "Outfit, sans-serif",
      }}
    >
      {/* Logo wash: the tile's own logo, covering the tile, heavily blurred and faded,
          so the tile takes on the logo's colours. Blur fades out at an image's edges,
          so the image overhangs the tile by twice the blur and the overflow is clipped.
          The logo and text below are position: relative so they paint above it. */}
      {!logoFailed && (
        <img
          aria-hidden
          alt=""
          src={logoUrl}
          style={{
            position: "absolute",
            top: -washBlur * 2,
            left: -washBlur * 2,
            width: `calc(100% + ${washBlur * 4}px)`,
            height: `calc(100% + ${washBlur * 4}px)`,
            objectFit: "cover",
            filter: `blur(${washBlur}px) saturate(1.4)`,
            opacity: LOGO_WASH_OPACITY,
            pointerEvents: "none",
          }}
        />
      )}
      {rank !== undefined && (
        <span
          style={{
            position: "absolute",
            top: c.padding,
            left: c.padding,
            fontSize: c.rankSize,
            fontWeight: 400,
            lineHeight: 1,
            color: "var(--canvas-text-70)",
          }}
        >
          {rank}
        </span>
      )}
      {logoFailed ? (
        <div
          style={{
            width: c.logoSize,
            height: c.logoSize,
            flexShrink: 0,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: c.logoSize * 0.5,
            fontWeight: 700,
            color: "var(--canvas-text-dim)",
          }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      ) : (
        <img
          src={logoUrl}
          alt={name}
          onError={() => setLogoFailed(true)}
          style={{ position: "relative", width: c.logoSize, height: c.logoSize, objectFit: "contain", flexShrink: 0, borderRadius: 6 }}
        />
      )}

      {(c.nameLines || c.value) && (
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            alignItems: c.horizontal ? "flex-start" : "center",
            minWidth: 0,
            lineHeight: 1.15,
            whiteSpace: "nowrap",
          }}
        >
          {c.nameLines && (
            <span
              style={{
                fontSize: c.nameSize,
                fontWeight: NAME_WEIGHT,
                textAlign: c.horizontal ? "left" : "center",
                // Follows the theme: dark pill with light text on Dark, light pill with dark text on Light.
                color: "var(--canvas-text)",
                backgroundColor: "var(--canvas-card-bg-2)",
                border: "1px solid var(--canvas-border-15)",
                // A two-line name gets a rounded box; a full capsule would clip its corners.
                borderRadius: c.nameLines.length > 1 ? c.nameSize * 0.8 : 999,
                padding: `${c.pillPadY}px ${c.pillPadX}px`,
              }}
            >
              {c.nameLines.map((line, i) => (
                <span key={i} style={{ display: "block" }}>
                  {line}
                </span>
              ))}
            </span>
          )}
          {c.value && (
            <span
              style={{
                marginTop: c.nameLines ? c.textGap : 0,
                fontSize: c.valueSize,
                fontWeight: VALUE_WEIGHT,
                color: "var(--canvas-text-70)",
              }}
            >
              {c.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
