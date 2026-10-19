import { useState } from "react";
import type { LegibleSizes } from "@/shared/canvas/legibility";
import { InitialsLogo, initialsColor } from "@/shared/canvas/logos/InitialsLogo";
import { useResolvedLogo } from "@/shared/canvas/logos/resolve";
import type { Rect } from "@/shared/canvas/squarify";
import { DESCRIPTION_WEIGHT, NAME_WEIGHT, VALUE_WEIGHT } from "../utils/tiers";
import { listRowContent } from "../utils/list";
import { RankBadge } from "./Tile";

/** How strongly the blurred logo colours the row (as tiles); light, so text stays high-contrast. */
const LOGO_WASH_OPACITY = 0.18;

interface ListRowProps {
  rect: Rect;
  /** Size to fit the content to, when it should differ from the row's own (taller rows of a short column). */
  sizing?: { w: number; h: number };
  /** The list has descriptions: keep room for one, so every row matches. */
  withDescription: boolean;
  rank: number;
  name: string;
  description?: string;
  logoUrl: string;
  /** The company's website, to look up a logo when its own doesn't work. */
  website?: string;
  /** Value text: formatted (Bento) or as written, or null for none. */
  value: string | null;
  /** Phone-readable minimum text sizes, in canvas px. */
  legible: LegibleSizes;
  /** Click-to-edit; gets the row to anchor the popover on. */
  onClick?: (el: HTMLElement) => void;
}

/**
 * A company as a full-width List row: rank, logo, name pill with its
 * description underneath, and the value on the right. Styled like a Tile
 * (card, bottom stroke, logo wash), with the wash centred on the logo.
 */
export function ListRow({
  rect,
  sizing = rect,
  withDescription,
  rank,
  name,
  description,
  logoUrl,
  website,
  value,
  legible,
  onClick,
}: ListRowProps) {
  const resolved = useResolvedLogo(logoUrl, website);
  // A logo that still fails to draw shows initials until the lookup settles on another.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = resolved && resolved !== failedSrc ? resolved : null;
  const c = listRowContent(sizing.w, sizing.h, name, description ?? null, value, legible, withDescription);
  const washSize = rect.h * 3;
  const logoCenterX = c.padding + c.rankSize + c.gap + c.logoSize / 2;

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
        borderBottom: "2px solid var(--canvas-border-15)",
        borderRadius: 6,
        boxSizing: "border-box",
        padding: `0 ${c.padding}px`,
        display: "flex",
        alignItems: "center",
        gap: c.gap,
        overflow: "hidden",
        fontFamily: "Outfit, sans-serif",
      }}
    >
      {/* Logo wash: the logo, blurred and faded, centred on the logo so it tints
          the left of the row. Content below is position: relative to paint above it. */}
      {src ? (
        <img
          aria-hidden
          alt=""
          src={src}
          style={{
            position: "absolute",
            left: logoCenterX - washSize / 2,
            top: (rect.h - washSize) / 2,
            width: washSize,
            height: washSize,
            objectFit: "cover",
            filter: `blur(${Math.max(16, rect.h * 0.35)}px) saturate(1.4)`,
            opacity: LOGO_WASH_OPACITY,
            pointerEvents: "none",
          }}
        />
      ) : (
        // No logo: tint the left of the row in the initials logo's colour instead.
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background: `linear-gradient(to right, ${initialsColor(name)}, transparent 60%)`,
            opacity: LOGO_WASH_OPACITY,
            pointerEvents: "none",
          }}
        />
      )}
      <RankBadge rank={rank} size={c.rankSize} />
      {src ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailedSrc(src)}
          style={{ position: "relative", width: c.logoSize, height: c.logoSize, objectFit: "contain", flexShrink: 0, borderRadius: 6 }}
        />
      ) : (
        // Same slot as a logo, so names line up; drawn a bit smaller, as real logos carry padding.
        <div style={{ position: "relative", width: c.logoSize, height: c.logoSize, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <InitialsLogo name={name} size={c.logoSize * 0.85} />
        </div>
      )}

      <div
        style={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          lineHeight: 1.15,
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            fontSize: c.nameSize,
            fontWeight: NAME_WEIGHT,
            color: "var(--canvas-text)",
            backgroundColor: "var(--canvas-card-bg-2)",
            borderRadius: 999,
            padding: `${c.pillPadY}px ${c.pillPadX}px`,
          }}
        >
          {c.name}
        </span>
        {c.descriptionLines && (
          <span
            style={{
              marginTop: c.textGap,
              // Lines up with the name's text, not its pill.
              paddingLeft: c.pillPadX,
              fontSize: c.descriptionSize,
              fontWeight: DESCRIPTION_WEIGHT,
              color: "var(--canvas-text-85)",
            }}
          >
            {c.descriptionLines.map((line, i) => (
              <span key={i} style={{ display: "block" }}>
                {line}
              </span>
            ))}
          </span>
        )}
      </div>

      {c.value && (
        <span
          style={{
            position: "relative",
            flexShrink: 0,
            fontSize: c.valueSize,
            fontWeight: VALUE_WEIGHT,
            color: "var(--canvas-text-85)",
            whiteSpace: "nowrap",
          }}
        >
          {c.value}
        </span>
      )}
    </div>
  );
}
