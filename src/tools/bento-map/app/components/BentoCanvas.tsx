import { useEffect, useMemo, useRef, useState } from "react";
import type { BentoItem } from "../utils/parseSheet";
import { allocateAreas } from "../utils/minArea";
import { insetAndSnap, squarify } from "../utils/squarify";
import { formatValue } from "../utils/value";
import { BentoTile } from "./BentoTile";

interface BentoCanvasProps {
  items: BentoItem[];
  symbol: string;
  minTileSide: number;
  tileGap: number;
  /** Reports how many tiles were enlarged to the minimum size (not to scale). */
  onMinimumCountChange?: (count: number) => void;
}

export function BentoCanvas({ items, symbol, minTileSide, tileGap, onMinimumCountChange }: BentoCanvasProps) {
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

  const layout = useMemo(() => {
    if (box.w === 0 || box.h === 0 || items.length === 0) return { tiles: [], atMinimum: 0 };
    // Extend the bounds by half a gap on every side so the outer tiles sit flush
    // with the content box once each tile is inset by half a gap. The areas must
    // be shared out over these same bounds: allocating over the smaller content
    // box left the difference as an empty corner after the last tile.
    const half = tileGap / 2;
    const bounds = { x: -half, y: -half, w: box.w + tileGap, h: box.h + tileGap };
    const sized = allocateAreas(items.map((i) => i.value), bounds.w * bounds.h, minTileSide);
    const rects = insetAndSnap(squarify(sized.map((s) => s.area), bounds), tileGap);
    return {
      tiles: items.map((item, i) => ({ item, rect: rects[i] })),
      atMinimum: sized.filter((s) => s.atMinimum).length,
    };
    // fontsVersion re-runs the tiles' text fitting after the font loads.
  }, [items, box.w, box.h, minTileSide, tileGap, fontsVersion]);

  useEffect(() => {
    onMinimumCountChange?.(layout.atMinimum);
  }, [layout.atMinimum, onMinimumCountChange]);

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {layout.tiles.map(({ item, rect }) => (
        <BentoTile
          key={`${item.id}-${item.logoUrl}`}
          rect={rect}
          name={item.name}
          logoUrl={item.logoUrl}
          value={formatValue(item.value, symbol, item.approximate)}
        />
      ))}
    </div>
  );
}
