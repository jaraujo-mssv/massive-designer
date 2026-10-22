import { useState } from "react";
import { InitialsLogo } from "@/shared/canvas/logos/InitialsLogo";
import { useResolvedLogo } from "@/shared/canvas/logos/resolve";
import type { Rect } from "@/shared/canvas/squarify";
import {
  LEGACY_DESCRIPTION_WEIGHT,
  LEGACY_LINE_HEIGHT,
  LEGACY_NAME_WEIGHT,
  LEGACY_RANK_WEIGHT,
  LEGACY_VALUE_WEIGHT,
  LegacyCardMetrics,
  legacyCardContent,
} from "../utils/legacyList";

interface LegacyListRowProps {
  rect: Rect;
  metrics: LegacyCardMetrics;
  rank: number;
  name: string;
  description?: string;
  logoUrl: string;
  /** The company's website, to look up a logo when its own doesn't work. */
  website?: string;
  /** Value text: formatted (Bento) or as written, or null for none. */
  value: string | null;
  /** Click-to-edit; gets the card to anchor the popover on. */
  onClick?: (el: HTMLElement) => void;
}

/**
 * A company as the old Top List drew it: a bordered card with the rank as a
 * plain number, the logo, the name, and the value in a pill on the right (or
 * under the name, when `metrics.valueBelow`). No logo wash.
 */
export function LegacyListRow({ rect, metrics: m, rank, name, description, logoUrl, website, value, onClick }: LegacyListRowProps) {
  const resolved = useResolvedLogo(logoUrl, website);
  // A logo that still fails to draw shows initials until the lookup settles on another.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = resolved && resolved !== failedSrc ? resolved : null;
  const c = legacyCardContent(m, rect.w, name, description ?? null, value);
  const pill = c.value && (
    <span
      style={{
        flexShrink: 0,
        fontSize: m.valueSize,
        fontWeight: LEGACY_VALUE_WEIGHT,
        lineHeight: LEGACY_LINE_HEIGHT,
        color: "var(--canvas-text)",
        backgroundColor: "var(--canvas-card-bg-2)",
        border: "1px solid var(--canvas-border-15)",
        borderRadius: 999,
        padding: `${m.valuePadY}px ${m.valuePadX}px`,
        whiteSpace: "nowrap",
        ...(m.valueBelow && { alignSelf: "flex-start", marginTop: m.valueGap }),
      }}
    >
      {c.value}
    </span>
  );

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
        boxSizing: "border-box",
        backgroundColor: "var(--canvas-card-bg)",
        border: `${m.border}px solid var(--canvas-border)`,
        borderRadius: m.radius,
        padding: `0 ${m.padX}px`,
        display: "flex",
        alignItems: "center",
        gap: m.gap,
        overflow: "hidden",
        fontFamily: "Outfit, sans-serif",
      }}
    >
      <div
        style={{
          width: m.rankBox,
          flexShrink: 0,
          textAlign: "center",
          fontSize: m.rankSize,
          fontWeight: LEGACY_RANK_WEIGHT,
          lineHeight: 1,
          color: "var(--canvas-text)",
        }}
      >
        {rank}
      </div>
      {src ? (
        <img
          src={src}
          alt={name}
          onError={() => setFailedSrc(src)}
          style={{ width: m.logo, height: m.logo, objectFit: "contain", flexShrink: 0, borderRadius: 6 }}
        />
      ) : (
        // Same slot as a logo, so names line up; drawn a bit smaller, as real logos carry padding.
        <div style={{ width: m.logo, height: m.logo, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <InitialsLogo name={name} size={m.logo * 0.85} />
        </div>
      )}

      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: `0 ${m.namePadX}px`,
          display: "flex",
          flexDirection: "column",
          lineHeight: LEGACY_LINE_HEIGHT,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ fontSize: c.nameSize, fontWeight: LEGACY_NAME_WEIGHT, color: "var(--canvas-text)" }}>
          {c.nameLines.map((line, i) => (
            <span key={i} style={{ display: "block" }}>
              {line}
            </span>
          ))}
        </span>
        {m.valueBelow && pill}
        {c.description && (
          <span style={{ fontSize: m.descriptionSize, fontWeight: LEGACY_DESCRIPTION_WEIGHT, color: "var(--canvas-text-70)" }}>
            {c.description}
          </span>
        )}
      </div>

      {!m.valueBelow && pill}
    </div>
  );
}
