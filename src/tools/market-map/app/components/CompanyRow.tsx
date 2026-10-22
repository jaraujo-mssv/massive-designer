import { useState } from "react";
import { InitialsLogo } from "@/shared/canvas/logos/InitialsLogo";
import { useResolvedLogo } from "@/shared/canvas/logos/resolve";
import { COLUMN_LINE_HEIGHT, ColumnMetrics, ColumnRow } from "../utils/columns";
import { PillWash } from "./PillWash";

interface CompanyRowProps {
  row: ColumnRow;
  metrics: ColumnMetrics;
  /** Click-to-edit; gets the row to anchor the popover on. */
  onClick?: (el: HTMLElement) => void;
}

/**
 * A company in a Columns card: logo, then name. In the modern look it's a
 * slim pill as wide as its sub-column, tinted by its logo (as CompanyPill);
 * in the legacy look there's nothing around them, as the old tool drew it.
 * The logo is found as in CompanyPill. A "+N more" row is text only.
 */
export function CompanyRow({ row, metrics: m, onClick }: CompanyRowProps) {
  const { company } = row;
  const more = company.more ?? false;
  const modern = m.look === "modern";
  const resolved = useResolvedLogo(more ? "" : company.logoUrl, more ? undefined : company.website);
  // A logo that still fails to draw shows initials until the lookup settles on another.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const src = resolved && resolved !== failedSrc ? resolved : null;

  return (
    <div
      title={company.name}
      className={onClick ? "canvas-editable" : undefined}
      onClick={onClick && ((e) => onClick(e.currentTarget))}
      style={{
        position: "absolute",
        left: row.x,
        top: row.y,
        width: row.w,
        height: row.h,
        boxSizing: "border-box",
        display: "flex",
        alignItems: "center",
        gap: m.logoGap,
        padding: `${m.rowPadY}px ${m.rowPadX}px`,
        fontSize: m.fontSize,
        lineHeight: COLUMN_LINE_HEIGHT,
        whiteSpace: "nowrap",
        ...(modern && {
          backgroundColor: "var(--canvas-pill-bg)",
          // A wrapped name gets a rounded box; a full capsule would clip its corners.
          borderRadius: row.lines.length > 1 ? m.fontSize * 0.8 : 999,
          overflow: "hidden",
        }),
      }}
    >
      {modern && !more && <PillWash src={src} name={company.name} size={row.w} blur={Math.max(8, row.h * 0.5)} />}
      {more ? (
        // Legacy "+N more" lines up with the names; a modern one starts at the pill's edge.
        !modern && <div style={{ width: m.logo, flexShrink: 0 }} />
      ) : src ? (
        <img
          src={src}
          alt={company.name}
          onError={() => setFailedSrc(src)}
          style={{
            position: "relative",
            width: m.logo,
            height: m.logo,
            objectFit: "contain",
            flexShrink: 0,
            borderRadius: modern ? 4 : 6,
          }}
        />
      ) : (
        <InitialsLogo name={company.name} size={m.logo} />
      )}
      <div
        style={{
          position: "relative",
          minWidth: 0,
          padding: `0 ${m.namePadX}px`,
          color: more ? (modern ? "var(--canvas-text-85)" : "var(--canvas-text-70)") : modern ? "var(--canvas-text)" : "var(--canvas-text-85)",
          fontWeight: more ? m.moreWeight : m.nameWeight,
        }}
      >
        {row.lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
    </div>
  );
}
