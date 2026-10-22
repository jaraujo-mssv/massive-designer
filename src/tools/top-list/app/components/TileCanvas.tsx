import { useEffect, useMemo, useRef, useState } from "react";
import type { LegibleSizes } from "@/shared/canvas/legibility";
import type { Layout, ListItem, ListView } from "../utils/parseSheet";
import { gridRects } from "../utils/grid";
import { LegacyListLayout, legacyListLayout } from "../utils/legacyList";
import { listRects, listRowContent } from "../utils/list";
import { tileContent } from "../utils/tiers";
import { allocateAreas } from "../utils/minArea";
import { insetAndSnap, Rect, squarify } from "@/shared/canvas/squarify";
import { formatValue } from "../utils/value";
import { LegacyListRow } from "./LegacyListRow";
import { ListRow } from "./ListRow";
import { Tile } from "./Tile";

interface TileCanvasProps {
  /** List rows or tiles (Bento or equal, as `layout` decides). */
  view: ListView;
  /** A legacy theme: the old columns of cards in List, and the old card look on tiles. */
  legacy: boolean;
  layout: Layout;
  items: ListItem[];
  symbol: string;
  /** Bento only; raised to fit a phone-readable name when that needs more. */
  minTileSide: number;
  tileGap: number;
  /** Phone-readable minimum text sizes, in canvas px (`legibleSizes`). */
  legible: LegibleSizes;
  /** Bento only: reports how many tiles were enlarged to the minimum size (not to scale). */
  onMinimumCountChange?: (count: number) => void;
  /** Reports what couldn't stay phone-readable, for the sidebar's warning. */
  onLegibilityChange?: (report: LegibilityReport) => void;
  /** Click-to-edit; leave out to make the tiles read-only (e.g. while exporting). */
  onEdit?: (id: string, el: HTMLElement) => void;
}

/** What couldn't be drawn at a phone-readable size. */
export interface LegibilityReport {
  /** List rows too short for a readable name: their names are smaller. */
  shrunkNames: number;
  /** The smallest name size among those, in canvas px (0 when none). */
  smallestName: number;
  /** Tiles with no room for a readable name, so they show only the logo. */
  logoOnly: number;
}

/** As TileCanvas renders it: as written when the sheet's text matters, else the Bento value, formatted. */
function valueText(item: ListItem, symbol: string): string | null {
  return item.valueLabel ?? (item.value !== undefined ? formatValue(item.value, symbol, item.approximate) : null);
}

/**
 * Lays out and draws the list: full-width ranked rows for the `list` view (the
 * old columns of cards under a legacy theme); otherwise tiles, a treemap sized
 * by value for `bento` and equal tiles in rank order for `grid`.
 */
export function TileCanvas({
  view,
  legacy,
  layout,
  items,
  symbol,
  minTileSide,
  tileGap,
  legible,
  onMinimumCountChange,
  onLegibilityChange,
  onEdit,
}: TileCanvasProps) {
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

  // In List, every row keeps room for a description when any company has one.
  const withDescriptions = items.some((i) => i.description);

  const placed = useMemo((): {
    tiles: { item: ListItem; rect: Rect; sizing: { w: number; h: number } | undefined }[];
    atMinimum: number;
    /** List rows show their values under the names (two columns). */
    valueBelow?: boolean;
    /** The legacy List's shared card metrics, when that's what's drawn. */
    legacyList?: LegacyListLayout;
  } => {
    if (box.w === 0 || box.h === 0 || items.length === 0) return { tiles: [], atMinimum: 0 };
    if (view === "list" && legacy) {
      const entries = items.map((i) => ({ rank: i.rank, name: i.name, value: valueText(i, symbol) }));
      const legacyList = legacyListLayout(entries, box, tileGap, legible, withDescriptions);
      if (!legacyList) return { tiles: [], atMinimum: 0 };
      return {
        tiles: items.map((item, i) => ({ item, rect: legacyList.rects[i], sizing: undefined })),
        atMinimum: 0,
        legacyList,
      };
    }
    // Extend the bounds by half a gap on every side so the outer tiles sit flush
    // with the content box once each tile is inset by half a gap. Bento areas must
    // be shared out over these same bounds: allocating over the smaller content
    // box left the difference as an empty corner after the last tile.
    const half = tileGap / 2;
    const bounds = { x: -half, y: -half, w: box.w + tileGap, h: box.h + tileGap };

    if (view === "list") {
      const list = listRects(items.length, bounds);
      const rects = insetAndSnap(list.rects, tileGap);
      // Every row's content is sized from the shortest row (the left column's, when
      // the right one has fewer, taller rows), so all rows match.
      const regular = { w: rects[0].w, h: Math.min(...rects.map((r) => r.h)) };
      // Half-width rows put the value under the name, to leave the name the row's width.
      const valueBelow = list.columns > 1 && items.some((i) => valueText(i, symbol));
      return { tiles: items.map((item, i) => ({ item, rect: rects[i], sizing: regular })), atMinimum: 0, valueBelow };
    }
    if (layout === "grid") {
      const rects = insetAndSnap(gridRects(items.length, bounds), tileGap);
      // Size every tile's content from a regular full-row tile, so the stretched
      // tiles in a short last row don't get bigger logos and text than rank 1.
      const regular = { w: Math.min(...rects.map((r) => r.w)), h: rects[0].h };
      return { tiles: items.map((item, i) => ({ item, rect: rects[i], sizing: regular })), atMinimum: 0 };
    }
    // A minimum tile must hold a phone-readable name, which a wide canvas needs more pixels for.
    const minSide = Math.max(minTileSide, legible.primary * 6);
    const sized = allocateAreas(items.map((i) => i.value ?? 0), bounds.w * bounds.h, minSide);
    const rects = insetAndSnap(squarify(sized.map((s) => s.area), bounds), tileGap);
    return {
      tiles: items.map((item, i) => ({ item, rect: rects[i], sizing: undefined })),
      atMinimum: sized.filter((s) => s.atMinimum).length,
    };
    // fontsVersion re-runs the tiles' text fitting after the font loads.
  }, [view, legacy, layout, items, symbol, withDescriptions, box.w, box.h, minTileSide, tileGap, legible, fontsVersion]);

  useEffect(() => {
    onMinimumCountChange?.(placed.atMinimum);
  }, [placed.atMinimum, onMinimumCountChange]);

  // The same content rules the rows and tiles render with, counted for the warning.
  const report = useMemo<LegibilityReport>(() => {
    // Legacy cards all share one size, so either every name is readable or none is.
    if (placed.legacyList) {
      const { shrunk, metrics } = placed.legacyList;
      return { shrunkNames: shrunk ? placed.tiles.length : 0, smallestName: shrunk ? metrics.nameSize : 0, logoOnly: 0 };
    }
    let shrunkNames = 0;
    let smallestName = 0;
    let logoOnly = 0;
    for (const { item, rect, sizing } of placed.tiles) {
      const value = valueText(item, symbol);
      if (view === "list") {
        const fit = sizing ?? rect;
        const c = listRowContent(
          fit.w,
          fit.h,
          item.name,
          item.description ?? null,
          value,
          legible,
          withDescriptions,
          placed.valueBelow,
        );
        if (c.shrunk) {
          shrunkNames++;
          smallestName = smallestName === 0 ? c.nameSize : Math.min(smallestName, c.nameSize);
        }
      } else {
        const fit = sizing ?? rect;
        const c = tileContent(fit.w, fit.h, item.name, value, layout === "grid", rect.w, item.description ?? null, legible);
        if (!c.nameLines) logoOnly++;
      }
    }
    return { shrunkNames, smallestName, logoOnly };
  }, [placed, view, layout, symbol, legible, withDescriptions]);

  useEffect(() => {
    onLegibilityChange?.(report);
  }, [report, onLegibilityChange]);

  return (
    <div ref={boxRef} style={{ position: "relative", width: "100%", height: "100%" }}>
      {placed.tiles.map(({ item, rect, sizing }) => {
        const key = `${item.id}-${item.logoUrl}`;
        const value = valueText(item, symbol);
        const onClick = onEdit && ((el: HTMLElement) => onEdit(item.id, el));
        if (placed.legacyList) {
          return (
            <LegacyListRow
              key={key}
              rect={rect}
              metrics={placed.legacyList.metrics}
              rank={item.rank}
              name={item.name}
              description={item.description}
              logoUrl={item.logoUrl}
              website={item.website}
              value={value}
              onClick={onClick}
            />
          );
        }
        return view === "list" ? (
          <ListRow
            key={key}
            rect={rect}
            sizing={sizing}
            withDescription={withDescriptions}
            valueBelow={placed.valueBelow}
            rank={item.rank}
            name={item.name}
            description={item.description}
            logoUrl={item.logoUrl}
            website={item.website}
            value={value}
            legible={legible}
            onClick={onClick}
          />
        ) : (
          <Tile
            key={key}
            rect={rect}
            sizing={sizing}
            name={item.name}
            description={item.description}
            logoUrl={item.logoUrl}
            website={item.website}
            value={value}
            rank={layout === "grid" ? item.rank : undefined}
            legible={legible}
            legacy={legacy}
            onClick={onClick}
          />
        );
      })}
    </div>
  );
}
