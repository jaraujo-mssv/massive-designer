import { useState } from "react";
import type { Rect } from "../utils/squarify";
import { NAME_WEIGHT, VALUE_WEIGHT, tileContent } from "../utils/tiers";
import { tileTint } from "../utils/tint";

interface BentoTileProps {
  rect: Rect;
  name: string;
  logoUrl: string;
  value: string;
}

export function BentoTile({ rect, name, logoUrl, value }: BentoTileProps) {
  const [logoFailed, setLogoFailed] = useState(!logoUrl);
  const c = tileContent(rect.w, rect.h, name, value);
  const tint = tileTint(name);

  return (
    <div
      title={`${name} · ${value}`}
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        backgroundColor: "var(--canvas-card-bg)",
        border: "1px solid var(--canvas-border)",
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
      {/* Shade variation: the theme's text colour at a small per-tile opacity. The
          logo and text below are position: relative so they paint above it. */}
      <div
        aria-hidden
        style={{ position: "absolute", inset: 0, backgroundColor: "var(--canvas-text)", opacity: tint, pointerEvents: "none" }}
      />
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

      {(c.name || c.value) && (
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
          {c.name && (
            <span
              style={{
                fontSize: c.nameSize,
                fontWeight: NAME_WEIGHT,
                // Inverted against the tile for contrast: cream pill on Dark, ink pill on Light.
                color: "var(--canvas-card-bg)",
                backgroundColor: "var(--canvas-text)",
                border: "1px solid var(--canvas-text)",
                borderRadius: 999,
                padding: `${c.pillPadY}px ${c.pillPadX}px`,
              }}
            >
              {c.name}
            </span>
          )}
          {c.value && (
            <span
              style={{
                marginTop: c.name ? c.textGap : 0,
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
