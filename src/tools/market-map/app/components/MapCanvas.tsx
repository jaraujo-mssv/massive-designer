import { useEffect, useMemo, useRef, useState } from "react";
import type { Category } from "../utils/parseSheet";
import { layoutColumns } from "../utils/columns";
import { FitMode, HiddenGroup, layoutMap } from "../utils/layout";
import { CategoryCard } from "./CategoryCard";
import { CategoryTile } from "./CategoryTile";
import type { MapEditTarget } from "./MapEditor";

/** Columns of category cards (columns.ts), or a treemap of tiles with pills (layout.ts). */
export type MapView = "columns" | "tiles";

/** How the map was made to fit, for the warning above Export. */
export interface FitInfo {
  /** Pill font size used, in canvas pixels. */
  fontSize: number;
  /** False when pills had to shrink below the readable size. */
  readable: boolean;
  /** Companies left out to fit ('hide' mode). */
  hidden: HiddenGroup[];
}

interface MapCanvasProps {
  categories: Category[];
  view: MapView;
  /** A legacy theme: the old tool's look (Columns only). */
  legacy: boolean;
  tileGap: number;
  fitMode: FitMode;
  /** The smallest pill name size that reads on a phone, in canvas px (`legibleSizes`). */
  minFont: number;
  onFitChange?: (fit: FitInfo | null) => void;
  /** Click-to-edit; leave out to make the map read-only (e.g. while exporting). */
  onEdit?: (target: MapEditTarget, el: HTMLElement) => void;
}

/**
 * Measures the available box and draws the map: columns of cards from
 * `layoutColumns` (in the theme's look), or category tiles from `layoutMap`.
 */
export function MapCanvas({ categories, view, legacy, tileGap, fitMode, minFont, onFitChange, onEdit }: MapCanvasProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [fontsVersion, setFontsVersion] = useState(0);

  // ResizeObserver reports layout size, which the preview's scale() transform
  // doesn't touch, so the layout is always in canvas pixels.
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setBox({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Pill widths are measured with Outfit; redo the layout once the font has loaded.
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) setFontsVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const tiles = useMemo(
    () => (view === "tiles" ? layoutMap(categories, box, tileGap, fitMode, minFont) : null),
    // fontsVersion re-runs the measuring after the font loads.
    [view, categories, box.w, box.h, tileGap, fitMode, minFont, fontsVersion],
  );
  const columns = useMemo(
    () =>
      view === "columns"
        ? layoutColumns(categories, box, tileGap, fitMode, minFont, legacy ? "legacy" : "modern")
        : null,
    [view, legacy, categories, box.w, box.h, tileGap, fitMode, minFont, fontsVersion],
  );
  const layout = columns ?? tiles;

  // Reported once per new layout (layout is memoised, so this doesn't loop).
  useEffect(() => {
    onFitChange?.(
      layout ? { fontSize: layout.metrics.fontSize, readable: layout.readable, hidden: layout.hidden } : null,
    );
  }, [layout, onFitChange]);

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {tiles?.tiles.map((tile) => (
        <CategoryTile key={tile.category.id} tile={tile} metrics={tiles.metrics} onEdit={onEdit} />
      ))}
      {columns?.cards.map((card) => (
        <CategoryCard key={card.category.id} card={card} metrics={columns.metrics} onEdit={onEdit} />
      ))}
      {/* Modern looks: rules between categories (and, in Columns, between columns). */}
      {layout?.separators.map((s) => (
        <div
          key={`${s.x}-${s.y}`}
          style={{
            position: "absolute",
            left: s.x,
            top: s.y,
            width: s.w,
            height: s.h,
            backgroundColor: "var(--canvas-border-strong)",
            pointerEvents: "none",
          }}
        />
      ))}
    </div>
  );
}
