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

/**
 * A category: its name on the first row and its companies as pills below. No
 * outline: MapCanvas draws rules between the tiles, as in Columns.
 */
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
        overflow: "hidden",
        fontFamily: "Outfit, sans-serif",
      }}
    >
      {/* Plain bold text in the category colour, set apart from the company names by size and weight. */}
      <div
        className={onEdit ? "canvas-editable" : undefined}
        onClick={onEdit && ((e) => onEdit({ kind: "category", categoryId: tile.category.id }, e.currentTarget))}
        style={{
          position: "absolute",
          left: header.x,
          top: header.y,
          width: header.w,
          height: header.h,
          color: "var(--canvas-category)",
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
          website={p.company.website}
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
