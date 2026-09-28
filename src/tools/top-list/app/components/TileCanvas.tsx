import { useEffect, useMemo, useRef, useState } from "react";
import type { Layout, ListItem } from "../utils/parseSheet";
import { gridRects } from "../utils/grid";
import { allocateAreas } from "../utils/minArea";
import { insetAndSnap, squarify } from "../utils/squarify";
import { formatValue } from "../utils/value";
import { Tile } from "./Tile";

interface TileCanvasProps {
  layout: Layout;
  items: ListItem[];
  symbol: string;
  /** Bento only. */
  minTileSide: number;
  tileGap: number;
  /** Bento only: reports how many tiles were enlarged to the minimum size (not to scale). */
  onMinimumCountChange?: (count: number) => void;
}

/**
 * Lays out and draws the tiles: a treemap sized by value for `bento`, equal
 * tiles in rank order for `grid`.
 */
export function TileCanvas({ layout, items, symbol, minTileSide, tileGap, onMinimumCountChange }: TileCanvasProps) {
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

  // Text fitting measures with Outfit; redo it once the font has actually loaded.
  useEffect(() => {
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) setFontsVersion((v) => v + 1);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const placed = useMemo(() => {
    if (box.w === 0 || box.h === 0 || items.length === 0) return { tiles: [], atMinimum: 0 };
    // Extend the bounds by half a gap on every side so the outer tiles sit flush
    // with the content box once each tile is inset by half a gap. Bento areas must
    // be shared out over these same bounds: allocating over the smaller content
    // box left the difference as an empty corner after the last tile.
    const half = tileGap / 2;
    const bounds = { x: -half, y: -half, w: box.w + tileGap, h: box.h + tileGap };

    if (layout === "grid") {
      const rects = insetAndSnap(gridRects(items.length, bounds), tileGap);
      // Size every tile's content from a regular full-row tile, so the stretched
      // tiles in a short last row don't get bigger logos and text than rank 1.
      const regular = { w: Math.min(...rects.map((r) => r.w)), h: rects[0].h };
      return { tiles: items.map((item, i) => ({ item, rect: rects[i], sizing: regular })), atMinimum: 0 };
    }
    const sized = allocateAreas(items.map((i) => i.value ?? 0), bounds.w * bounds.h, minTileSide);
    const rects = insetAndSnap(squarify(sized.map((s) => s.area), bounds), tileGap);
    return {
      tiles: items.map((item, i) => ({ item, rect: rects[i], sizing: undefined })),
      atMinimum: sized.filter((s) => s.atMinimum).length,
    };
    // fontsVersion re-runs the tiles' text fitting after the font loads.
  }, [layout, items, box.w, box.h, minTileSide, tileGap, fontsVersion]);

  useEffect(() => {
    onMinimumCountChange?.(placed.atMinimum);
  }, [placed.atMinimum, onMinimumCountChange]);

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {placed.tiles.map(({ item, rect, sizing }) => (
        <Tile
          key={`${item.id}-${item.logoUrl}`}
          rect={rect}
          sizing={sizing}
          name={item.name}
          logoUrl={item.logoUrl}
          value={item.value !== undefined ? formatValue(item.value, symbol, item.approximate) : null}
          rank={layout === "grid" ? item.rank : undefined}
        />
      ))}
    </div>
  );
}
