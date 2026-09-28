import type { PillMetrics } from "../utils/pills";
import { HEADER_WEIGHT, PlacedTile } from "../utils/layout";
import { CompanyPill } from "./CompanyPill";

interface CategoryTileProps {
  tile: PlacedTile;
  metrics: PillMetrics;
}

/** A category: its name centred at the top and its companies as pills below. */
export function CategoryTile({ tile, metrics }: CategoryTileProps) {
  const { rect, padding, headerLines, headerSize, pills } = tile;
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        boxSizing: "border-box",
        border: "2px dashed var(--canvas-border-15)",
        borderRadius: 6,
        overflow: "hidden",
        fontFamily: "Outfit, sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: padding,
          left: padding,
          right: padding,
          fontSize: headerSize,
          fontWeight: HEADER_WEIGHT,
          lineHeight: 1.2,
          color: "var(--canvas-red)",
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {headerLines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      {pills.map((p) => (
        <CompanyPill
          key={p.company.id}
          name={p.company.name}
          logoUrl={p.company.logoUrl}
          x={p.x}
          y={p.y}
          width={p.w}
          metrics={metrics}
        />
      ))}
    </div>
  );
}
