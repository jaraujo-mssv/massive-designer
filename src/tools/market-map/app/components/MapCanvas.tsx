import { useEffect, useMemo, useRef, useState } from "react";
import type { Category } from "../utils/parseSheet";
import { layoutMap } from "../utils/layout";
import { CategoryTile } from "./CategoryTile";

interface MapCanvasProps {
  categories: Category[];
  tileGap: number;
  /** Reports when the map doesn't fit even at the smallest pill size. */
  onOverflowChange?: (overflow: boolean) => void;
}

/** Measures the available box and draws the category tiles from `layoutMap`. */
export function MapCanvas({ categories, tileGap, onOverflowChange }: MapCanvasProps) {
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
    () => layoutMap(categories, box, tileGap),
    // fontsVersion re-runs the measuring after the font loads.
    [categories, box.w, box.h, tileGap, fontsVersion],
  );

  const overflow = layout?.overflow ?? false;
  useEffect(() => {
    onOverflowChange?.(overflow);
  }, [overflow, onOverflowChange]);

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {layout?.tiles.map((tile) => (
        <CategoryTile key={tile.category.id} tile={tile} metrics={layout.metrics} />
      ))}
    </div>
  );
}
