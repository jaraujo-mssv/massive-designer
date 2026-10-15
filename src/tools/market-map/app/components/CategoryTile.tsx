import type { PillMetrics } from "../utils/pills";
import { HEADER_WEIGHT, PlacedTile } from "../utils/layout";
import type { MapEditTarget } from "./MapEditor";
import { CompanyPill } from "./CompanyPill";

interface CategoryTileProps {
  tile: PlacedTile;
  metrics: PillMetrics;
  /** Click-to-edit: the clicked target and the element to anchor its popover on. */
  onEdit?: (target: MapEditTarget, el: HTMLElement) => void;
}

/** A category: its name as a pill on the first row and its companies as pills below. */
export function CategoryTile({ tile, metrics, onEdit }: CategoryTileProps) {
  const { rect, header, pills } = tile;
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        boxSizing: "border-box",
        border: "2px solid var(--canvas-border-strong)",
        borderRadius: 6,
        overflow: "hidden",
        fontFamily: "Outfit, sans-serif",
      }}
    >
      {/* The category pill inverts the theme (dark on Light, light on Dark), but in
          softened tones (--canvas-category-*) rather than full ink and cream. */}
      <div
        className={onEdit ? "canvas-editable" : undefined}
        onClick={onEdit && ((e) => onEdit({ kind: "category", categoryId: tile.category.id }, e.currentTarget))}
        style={{
          position: "absolute",
          left: header.x,
          top: header.y,
          width: header.w,
          height: header.h,
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: `${header.padY}px ${header.padX}px`,
          // A wrapped name gets a rounded box; a full capsule would clip its corners.
          borderRadius: header.lines.length > 1 ? header.fontSize * 0.8 : 999,
          backgroundColor: "var(--canvas-category-bg)",
          border: "1px solid var(--canvas-category-bg)",
          color: "var(--canvas-category-text)",
          fontSize: header.fontSize,
          fontWeight: HEADER_WEIGHT,
          lineHeight: 1.2,
          textAlign: "center",
          whiteSpace: "nowrap",
        }}
      >
        {header.lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      {pills.map((p) => (
        <CompanyPill
          // Keyed by logo too: a pill whose logo failed keeps showing its letter otherwise.
          key={`${p.company.id}-${p.company.logoUrl}`}
          name={p.company.name}
          logoUrl={p.company.logoUrl}
          x={p.x}
          y={p.y}
          width={p.w}
          metrics={metrics}
          more={p.company.more}
          onClick={
            onEdit &&
            ((el) =>
              onEdit(
                p.company.more
                  ? { kind: "more", categoryId: tile.category.id }
                  : { kind: "company", companyId: p.company.id },
                el,
              ))
          }
        />
      ))}
    </div>
  );
}
