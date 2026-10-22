import { COLUMN_LINE_HEIGHT, ColumnCard, ColumnMetrics } from "../utils/columns";
import { CompanyRow } from "./CompanyRow";
import type { MapEditTarget } from "./MapEditor";

interface CategoryCardProps {
  card: ColumnCard;
  metrics: ColumnMetrics;
  /** Click-to-edit: the clicked target and the element to anchor its popover on. */
  onEdit?: (target: MapEditTarget, el: HTMLElement) => void;
}

/**
 * A category in the Columns layout: its name at the top left and its
 * companies listed below. Modern: no card, the name in bold plain text in the
 * category colour (rules between categories are drawn by MapCanvas). Legacy:
 * the old tool's filled card with a solid stroke and the name in plain bold.
 */
export function CategoryCard({ card, metrics: m, onEdit }: CategoryCardProps) {
  const { rect, header, rows } = card;
  const modern = m.look === "modern";
  return (
    <div
      style={{
        position: "absolute",
        left: rect.x,
        top: rect.y,
        width: rect.w,
        height: rect.h,
        boxSizing: "border-box",
        fontFamily: "Outfit, sans-serif",
        // Modern rows reach the card's edges: clipping would cut their click-to-edit outline.
        ...(!modern && {
          backgroundColor: "var(--canvas-card-bg)",
          border: `${m.border}px solid var(--canvas-legacy-card-border, var(--canvas-border))`,
          borderRadius: m.radius,
          overflow: "hidden",
          // The old cards' shadow-sm.
          boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
        }),
      }}
    >
      <div
        className={onEdit ? "canvas-editable" : undefined}
        onClick={onEdit && ((e) => onEdit({ kind: "category", categoryId: card.category.id }, e.currentTarget))}
        style={{
          position: "absolute",
          left: header.x,
          top: header.y,
          width: header.w,
          height: header.h,
          boxSizing: "border-box",
          padding: `${m.headerPadY}px ${m.headerPadX}px`,
          fontSize: m.headerSize,
          fontWeight: m.headerWeight,
          lineHeight: COLUMN_LINE_HEIGHT,
          whiteSpace: "nowrap",
          // Modern: the accent colour, apart from the company names.
          color: modern ? "var(--canvas-category)" : "var(--canvas-text)",
        }}
      >
        {header.lines.map((line, i) => (
          <div key={i}>{line}</div>
        ))}
      </div>
      {rows.map((row) => (
        <CompanyRow
          // Keyed by logo too: a row whose logo failed keeps showing its letter otherwise.
          key={`${row.company.id}-${row.company.logoUrl}`}
          row={row}
          metrics={m}
          onClick={
            onEdit &&
            ((el) =>
              onEdit(
                row.company.more
                  ? { kind: "more", categoryId: card.category.id }
                  : { kind: "company", companyId: row.company.id },
                el,
              ))
          }
        />
      ))}
    </div>
  );
}
