import { useState } from "react";
import { InitialsLogo, initialsColor } from "@/shared/canvas/logos/InitialsLogo";
import { useResolvedLogo } from "@/shared/canvas/logos/resolve";
import type { LegibleSizes } from "@/shared/canvas/legibility";
import type { Rect } from "@/shared/canvas/squarify";
import { DESCRIPTION_WEIGHT, NAME_WEIGHT, VALUE_WEIGHT, tileContent } from "../utils/tiers";

/** How strongly the blurred logo colours the tile; kept light so text stays high-contrast. */
const LOGO_WASH_OPACITY = 0.18;

interface TileProps {
  rect: Rect;
  name: string;
  /** Shown under the name in smaller type, when there's room. */
  description?: string;
  logoUrl: string;
  /** The company's website, to look up a logo when its own doesn't work. */
  website?: string;
  /** Value text: formatted (Bento) or as written (grid labels), or null for none. */
  value: string | null;
  /** Rank shown as a red badge in the tile's top-left corner (grid tiles). */
  rank?: number;
  /**
   * Size to fit the content to, when it should differ from the tile's own:
   * grid tiles all use a regular tile's size, so every row looks the same.
   */
  sizing?: { w: number; h: number };
  /** Phone-readable minimum text sizes, in canvas px. */
  legible: LegibleSizes;
  /** Click-to-edit; gets the tile to anchor the popover on. */
  onClick?: (el: HTMLElement) => void;
}

/**
 * The rank as a brand-red circle with a white number: in a tile's top-left
 * corner when given an `inset`, otherwise inline (List rows).
 */
export function RankBadge({ rank, size, inset }: { rank: number; size: number; inset?: number }) {
  return (
    <div
      style={{
        ...(inset !== undefined
          ? { position: "absolute" as const, top: inset, left: inset }
          : { position: "relative" as const, flexShrink: 0 }),
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: "var(--canvas-red)",
        color: "#ffffff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: size * (rank >= 10 ? 0.46 : 0.56),
        fontWeight: 700,
        lineHeight: 1,
      }}
    >
      {rank}
    </div>
  );
}

export function Tile({ rect, name, description, logoUrl, website, value, rank, sizing = rect, legible, onClick }: TileProps) {
  const resolved = useResolvedLogo(logoUrl, website);
  // A logo that still fails to draw shows initials until the lookup settles on another.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = resolved && resolved !== failedSrc ? resolved : null;
  const c = tileContent(sizing.w, sizing.h, name, value, rank !== undefined, rect.w, description ?? null, legible);
  // Blur scales with the tile, so every tile gets a smooth wash, not a smudged logo.
  const washBlur = Math.min(80, Math.max(24, Math.min(rect.w, rect.h) * 0.18));

  return (
    <div
      title={value ? `${name} · ${value}` : name}
      className={onClick ? "canvas-editable" : undefined}
      onClick={onClick && ((e) => onClick(e.currentTarget))}
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        backgroundColor: "var(--canvas-card-bg)",
        // Only a bottom stroke: it grounds each tile without boxing it in.
        borderBottom: "2px solid var(--canvas-border-15)",
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
      {/* Logo wash: the tile's own logo as a square centred on the tile, as big as the
          tile's longer side, heavily blurred and faded, so the tile takes on the colours
          at the logo's centre. Blur fades out at an image's edges, so the image overhangs
          by twice the blur and the tile clips it. The logo and text below are
          position: relative so they paint above it. */}
      {src ? (
        <img
          aria-hidden
          alt=""
          src={src}
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            width: Math.max(rect.w, rect.h) + washBlur * 4,
            height: Math.max(rect.w, rect.h) + washBlur * 4,
            transform: "translate(-50%, -50%)",
            objectFit: "cover",
            objectPosition: "center",
            filter: `blur(${washBlur}px) saturate(1.4)`,
            opacity: LOGO_WASH_OPACITY,
            pointerEvents: "none",
          }}
        />
      ) : (
        // No logo: tint the tile in the initials logo's colour instead.
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundColor: initialsColor(name),
            opacity: LOGO_WASH_OPACITY,
            pointerEvents: "none",
          }}
        />
      )}
      {rank !== undefined && <RankBadge rank={rank} size={c.rankSize} inset={c.padding} />}
      {src ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailedSrc(src)}
          style={{ position: "relative", width: c.logoSize, height: c.logoSize, objectFit: "contain", flexShrink: 0, borderRadius: 6 }}
        />
      ) : (
        // Same slot as a logo; drawn a bit smaller, as real logos carry their own padding.
        <div style={{ position: "relative", width: c.logoSize, height: c.logoSize, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <InitialsLogo name={name} size={c.logoSize * 0.85} />
        </div>
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
          {c.descriptionLines && (
            <span
              style={{
                marginTop: c.textGap,
                fontSize: c.descriptionSize,
                fontWeight: DESCRIPTION_WEIGHT,
                color: "var(--canvas-text-85)",
                textAlign: c.horizontal ? "left" : "center",
              }}
            >
              {c.descriptionLines.map((line, i) => (
                <span key={i} style={{ display: "block" }}>
                  {line}
                </span>
              ))}
            </span>
          )}
          {c.value && (
            <span
              style={{
                marginTop: c.nameLines || c.descriptionLines ? c.textGap : 0,
                fontSize: c.valueSize,
                fontWeight: VALUE_WEIGHT,
                color: "var(--canvas-text-85)",
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
