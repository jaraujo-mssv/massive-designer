import { useEffect, useMemo, useRef, useState } from "react";
import type { LegibleSizes } from "@/shared/canvas/legibility";
import type { Layout, ListItem, ListView } from "../utils/parseSheet";
import { gridRects } from "../utils/grid";
import { LegacyListLayout, legacyListLayout } from "../utils/legacyList";
import { ListColumns, ListFit, listFit, ListRank, listRank, listRects, listRowContent, NUMBER_GAP, RankStyle } from "../utils/list";
import { RANK_INSIDE, RANK_WEIGHT, rankBadgeSize, tileContent, tileRankSize } from "../utils/tiers";
import { allocateAreas } from "../utils/minArea";
import { insetAndSnap, Rect, squarify } from "@/shared/canvas/squarify";
import { formatValue } from "../utils/value";
import { LegacyListRow } from "./LegacyListRow";
import { ListRow } from "./ListRow";
import { RankBadge, Tile } from "./Tile";

/** The share of a rank badge outside its item, over the gap (and above the first row). */
const RANK_OUTSIDE = 1 - RANK_INSIDE;

interface TileCanvasProps {
  /** List rows or tiles (Bento or equal, as `layout` decides). */
  view: ListView;
  /** A legacy theme: the old columns of cards in List, and the old card look on tiles. */
  legacy: boolean;
  layout: Layout;
  /** List only (not legacy): one or two columns, or by the count. */
  columns: ListColumns;
  /** List only: how the ranks are drawn (the legacy List's cards too). */
  rankStyle: RankStyle;
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
  /**
   * Reports the empty space above what's drawn, so the header can sit on it:
   * the legacy List's block of cards is centred; every other layout fills the box (0).
   */
  onTopSpaceChange?: (px: number) => void;
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
  columns,
  rankStyle,
  items,
  symbol,
  minTileSide,
  tileGap,
  legible,
  onMinimumCountChange,
  onLegibilityChange,
  onTopSpaceChange,
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
    /** The name and logo sizes every List row shares. */
    listFit?: ListFit;
    /** The List's ranks: their style, number size and room. */
    listRank?: ListRank;
    /** The legacy List's shared card metrics, when that's what's drawn. */
    legacyList?: LegacyListLayout;
    /** Diameter of the rank badges floating over each item's top-left corner, or 0 for none (Bento). */
    rankSize: number;
  } => {
    if (box.w === 0 || box.h === 0 || items.length === 0) return { tiles: [], atMinimum: 0, rankSize: 0 };
    // Rank badges overhang their item's top-left corner, so the first row is laid out
    // that much lower, clear of the header: once to size the badges, then again below them.
    if (view === "list" && legacy) {
      const entries = items.map((i) => ({ name: i.name, value: valueText(i, symbol), rank: i.rank }));
      const legacyAt = (top: number) => {
        const layout = legacyListLayout(entries, { w: box.w, h: box.h - top }, tileGap, legible, withDescriptions, rankStyle);
        return layout && { ...layout, rects: layout.rects.map((r) => ({ ...r, y: r.y + top })) };
      };
      let legacyList = legacyAt(0);
      // The block of cards is centred, so it may already leave the room (none needed without the badge).
      if (legacyList && Math.min(...legacyList.rects.map((r) => r.y)) < legacyList.metrics.rankSize * RANK_OUTSIDE) {
        legacyList = legacyAt(legacyList.metrics.rankSize * RANK_OUTSIDE);
      }
      if (!legacyList) return { tiles: [], atMinimum: 0, rankSize: 0 };
      const { rects } = legacyList;
      return {
        tiles: items.map((item, i) => ({ item, rect: rects[i], sizing: undefined })),
        atMinimum: 0,
        legacyList,
        // Numbers are drawn before the cards as before the modern rows.
        listRank: legacyList.metrics.rank,
        rankSize: legacyList.metrics.rankSize,
      };
    }
    // Extend the bounds by half a gap on every side so the outer tiles sit flush
    // with the content box once each tile is inset by half a gap. Bento areas must
    // be shared out over these same bounds: allocating over the smaller content
    // box left the difference as an empty corner after the last tile.
    const boundsBelow = (top: number, gap = tileGap) => ({ x: -gap / 2, y: top - gap / 2, w: box.w + gap, h: box.h + gap - top });

    if (view === "list") {
      // Every row's content is sized from the shortest row (the left column's, when
      // the right one has fewer, taller rows), so all rows match.
      const listAt = (top: number) => {
        const list = listRects(items.length, boundsBelow(top), columns);
        const rects = insetAndSnap(list.rects, tileGap);
        return { list, rects, regular: { w: rects[0].w, h: Math.min(...rects.map((r) => r.h)) } };
      };
      // Only the badge reaches over the row's top-left corner, so only it needs room above.
      const first = listAt(0);
      const { list, rects: rowRects, regular: rowRegular } =
        rankStyle === "badge" ? listAt(rankBadgeSize(first.regular.h, legible) * RANK_OUTSIDE) : first;
      const rank = listRank(rankStyle, rowRegular.w, rowRegular.h, legible, items.map((i) => i.rank));
      // Numbers sit to the left of their rows: each row starts after them.
      const rects = rank.gutter ? rowRects.map((r) => ({ ...r, x: r.x + rank.gutter, w: r.w - rank.gutter })) : rowRects;
      const regular = { w: rowRegular.w - rank.gutter, h: rowRegular.h };
      // Half-width rows put the value under the name, to leave the name the row's width.
      const valueBelow = list.columns > 1 && items.some((i) => valueText(i, symbol));
      // One name size and one logo size for every row, made to fit the longest names.
      const fit = listFit(
        items.map((i) => ({ name: i.name, value: valueText(i, symbol) })),
        regular.w,
        regular.h,
        legible,
        withDescriptions,
        valueBelow,
        rank,
      );
      return {
        tiles: items.map((item, i) => ({ item, rect: rects[i], sizing: regular })),
        atMinimum: 0,
        valueBelow,
        listFit: fit,
        listRank: rank,
        rankSize: rankStyle === "badge" ? rankBadgeSize(regular.h, legible) : 0,
      };
    }
    if (layout === "grid") {
      // Size every tile's content from a regular full-row tile, so the stretched
      // tiles in a short last row don't get bigger logos and text than rank 1.
      const gridAt = (top: number, gap = tileGap) => {
        const rects = insetAndSnap(gridRects(items.length, boundsBelow(top, gap)), gap);
        return { rects, regular: { w: Math.min(...rects.map((r) => r.w)), h: rects[0].h } };
      };
      const first = gridAt(0).regular;
      const reach = tileRankSize(first.w, first.h, legible) * RANK_OUTSIDE;
      // Legacy tiles are boxed: the gaps make room for the badges, so a badge keeps
      // half a gap clear of the tiles above and to the left of it (as the legacy List).
      const { rects, regular } = gridAt(reach, legacy ? tileGap / 2 + reach : tileGap);
      return {
        tiles: items.map((item, i) => ({ item, rect: rects[i], sizing: regular })),
        atMinimum: 0,
        rankSize: tileRankSize(regular.w, regular.h, legible),
      };
    }
    // Bento has no ranks, so no room above.
    const bounds = boundsBelow(0);
    // A minimum tile must hold a phone-readable name, which a wide canvas needs more pixels for.
    const minSide = Math.max(minTileSide, legible.primary * 6);
    const sized = allocateAreas(items.map((i) => i.value ?? 0), bounds.w * bounds.h, minSide);
    const rects = insetAndSnap(squarify(sized.map((s) => s.area), bounds), tileGap);
    return {
      tiles: items.map((item, i) => ({ item, rect: rects[i], sizing: undefined })),
      atMinimum: sized.filter((s) => s.atMinimum).length,
      rankSize: 0,
    };
    // fontsVersion re-runs the tiles' text fitting after the font loads.
  }, [view, legacy, layout, columns, rankStyle, items, symbol, withDescriptions, box.w, box.h, minTileSide, tileGap, legible, fontsVersion]);

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
          placed.listFit,
          placed.listRank,
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

  // Down to the top of the first card's rank badge.
  const topSpace = placed.legacyList
    ? Math.max(0, Math.round(Math.min(...placed.tiles.map((t) => t.rect.y)) - placed.rankSize * RANK_OUTSIDE))
    : 0;
  useEffect(() => {
    onTopSpaceChange?.(topSpace);
  }, [topSpace, onTopSpaceChange]);

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
            fit={placed.listFit}
            rank={item.rank}
            rankStyle={placed.listRank}
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
            withRank={layout === "grid"}
            legible={legible}
            legacy={legacy}
            onClick={onClick}
          />
        );
      })}
      {/* Big numbers, right-aligned in the space left of each row. */}
      {placed.listRank?.style === "number" &&
        placed.tiles.map(({ item, rect }) => (
          <div
            key={`rank-${item.id}`}
            aria-hidden
            style={{
              position: "absolute",
              left: rect.x - placed.listRank!.gutter,
              top: rect.y,
              width: placed.listRank!.gutter - placed.listRank!.fontSize * NUMBER_GAP,
              height: rect.h,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              fontFamily: "Outfit, sans-serif",
              fontSize: placed.listRank!.fontSize,
              fontWeight: RANK_WEIGHT,
              lineHeight: 1,
              color: "var(--canvas-text)",
              pointerEvents: "none",
            }}
          >
            {item.rank}
          </div>
        ))}
      {/* After every tile and row, so each badge sits above the neighbours it reaches over. */}
      {placed.rankSize > 0 &&
        placed.tiles.map(({ item, rect }) => (
          <RankBadge
            key={`rank-${item.id}`}
            rank={item.rank}
            size={placed.rankSize}
            left={rect.x - placed.rankSize * RANK_OUTSIDE}
            top={rect.y - placed.rankSize * RANK_OUTSIDE}
          />
        ))}
    </div>
  );
}
