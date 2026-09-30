import { useEffect, useMemo, useRef, useState } from "react";
import type { Category } from "../utils/parseSheet";
import { FitMode, HiddenGroup, layoutMap } from "../utils/layout";
import { CategoryTile } from "./CategoryTile";

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
  tileGap: number;
  fitMode: FitMode;
  onFitChange?: (fit: FitInfo | null) => void;
}

/** Measures the available box and draws the category tiles from `layoutMap`. */
export function MapCanvas({ categories, tileGap, fitMode, onFitChange }: MapCanvasProps) {
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

  const layout = useMemo(
    () => layoutMap(categories, box, tileGap, fitMode),
    // fontsVersion re-runs the measuring after the font loads.
    [categories, box.w, box.h, tileGap, fitMode, fontsVersion],
  );

  // Reported once per new layout (layout is memoised, so this doesn't loop).
  useEffect(() => {
    onFitChange?.(
      layout ? { fontSize: layout.metrics.fontSize, readable: layout.readable, hidden: layout.hidden } : null,
    );
  }, [layout, onFitChange]);

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {layout?.tiles.map((tile) => (
        <CategoryTile key={tile.category.id} tile={tile} metrics={layout.metrics} />
      ))}
    </div>
  );
}
