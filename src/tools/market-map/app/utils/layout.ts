import { textWidth, wrapLines } from '@/shared/canvas/measureText';
import { insetAndSnap, Rect, squarify } from '@/shared/canvas/squarify';
import type { Category, Company } from './parseSheet';
import { flowPills, pillMetrics, PillMetrics, pillWidth } from './pills';

/** Pill font size range, in canvas pixels. */
export const MIN_FONT = 11;
export const MAX_FONT = 24;

export const HEADER_WEIGHT = 500;
const TILE_BORDER = 2;
const LINE_HEIGHT = 1.2;
/** The category pill's 1px border, left and right (or top and bottom). */
const HEADER_PILL_BORDER = 2;
/**
 * Long category names wrap onto up to this many lines. Three lets a long name
 * with few companies have a compact, near-square tile instead of a wide one.
 */
const MAX_HEADER_LINES = 3;

export interface PlacedPill {
  company: Company;
  /** Inside the tile's padding box (the tile's border excluded). */
  x: number;
  y: number;
  w: number;
}

/** The category name as a pill, alone on the first row above the company pills. */
export interface PlacedHeader {
  lines: string[];
  fontSize: number;
  padX: number;
  padY: number;
  /** Inside the tile's padding box, like the company pills. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface PlacedTile {
  category: Category;
  rect: Rect;
  header: PlacedHeader;
  pills: PlacedPill[];
}

export interface MapLayout {
  metrics: PillMetrics;
  tiles: PlacedTile[];
  /** True when nothing fits even at MIN_FONT, so pills may be clipped. */
  overflow: boolean;
}

interface Measured {
  category: Category;
  widths: number[];
  weight: number;
}

function sizes(f: number) {
  const metrics = pillMetrics(f);
  const headerSize = f * 1.1;
  const padding = Math.min(22, Math.max(10, f));
  // The category pill has the company pills' proportions, so the two read as one set.
  return { metrics, headerSize, padding, headerPadX: headerSize * 0.7, headerPadY: headerSize * 0.4 };
}

/** Rounds of re-weighting before a font size is given up on. */
const MAX_ROUNDS = 20;
/** A tile whose content fills less of its height than this gives space back. */
const ROOMY_FILL = 0.75;
/** How full a roomy tile is shrunk towards. */
const TARGET_FILL = 0.9;

/**
 * Tries one pill font size: sizes each category's tile by its content, lays
 * the tiles out as a treemap, and flows the pills into them.
 *
 * The first weights are only estimates, so the layout is corrected in rounds
 * (up to MAX_ROUNDS): a tile too small for its header and pills has its weight
 * raised by what it's short, and a tile its content leaves mostly empty (under
 * ROOMY_FILL of its height) gives space back. Returns the fitting layout whose
 * emptiest tile is fullest, or null when no round fits, unless `force`, which
 * returns the last layout anyway.
 */
function attempt(categories: Category[], box: { w: number; h: number }, gap: number, f: number, force = false) {
  const { metrics, headerSize, padding, headerPadX, headerPadY } = sizes(f);
  const chrome = padding * 2 + TILE_BORDER * 2;
  const headerLineH = headerSize * LINE_HEIGHT;
  const headerPillX = headerPadX * 2 + HEADER_PILL_BORDER;
  // A category pill of `lines` lines, plus the row gap below it.
  const headerRowH = (lines: number) => lines * headerLineH + headerPadY * 2 + HEADER_PILL_BORDER + metrics.gapY;

  // First estimate of the tile area each category needs: its pill boxes (with
  // slack for ragged rows) in a roughly square block, but never narrower than
  // its widest pill or its category pill, whose name can wrap to three lines.
  const measured: Measured[] = categories.map((category) => {
    const widths = category.companies.map((c) => pillWidth(c.name, metrics));
    const pillArea = widths.reduce((sum, w) => sum + (w + metrics.gapX) * (metrics.height + metrics.gapY), 0) * 1.15;
    const minInnerW = Math.max(...widths, textWidth(category.name, headerSize, HEADER_WEIGHT) / MAX_HEADER_LINES + headerPillX);
    const innerW = Math.max(Math.sqrt(pillArea), minInnerW);
    const innerH = pillArea / innerW + headerRowH(1);
    return { category, widths, weight: (innerW + chrome) * (innerH + chrome) };
  });

  // Extend the bounds by half a gap on every side so the outer tiles sit flush
  // with the box once each tile is inset by half a gap (as in Top List).
  const bounds = { x: -gap / 2, y: -gap / 2, w: box.w + gap, h: box.h + gap };

  let tiles: PlacedTile[] = [];
  let best: { tiles: PlacedTile[]; minFill: number } | null = null;
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const order = [...measured].sort((a, b) => b.weight - a.weight);
    const totalWeight = order.reduce((sum, m) => sum + m.weight, 0);
    const areas = order.map((m) => (m.weight / totalWeight) * bounds.w * bounds.h);
    const rects = insetAndSnap(squarify(areas, bounds), gap);

    tiles = [];
    let allFit = true;
    let anyRoomy = false;
    let minFill = Infinity;
    order.forEach((m, i) => {
      const { category, widths } = m;
      const rect = rects[i];
      const innerW = rect.w - chrome;
      const innerH = rect.h - chrome;

      const headerW = textWidth(category.name, headerSize, HEADER_WEIGHT);
      const wrapped = wrapLines(category.name, innerW - headerPillX, headerSize, HEADER_WEIGHT, MAX_HEADER_LINES);
      const headerFits = wrapped !== null;
      const headerLines = wrapped ?? [category.name];
      const headerH = headerRowH(headerLines.length);
      const flow = flowPills(widths, innerW, metrics);

      if (!flow.fits || !headerFits) {
        // Too narrow for its widest pill or its header: grow in both directions.
        allFit = false;
        const needW = Math.max(...widths, headerFits ? 0 : headerW / MAX_HEADER_LINES + headerPillX);
        m.weight *= Math.max(1.1, ((needW + chrome) / Math.max(1, rect.w)) ** 2);
      } else if (headerH + flow.height > innerH) {
        // Wide enough but too short: grow by the missing height.
        allFit = false;
        m.weight *= Math.max(1.05, (headerH + flow.height + chrome) / Math.max(1, rect.h));
      } else {
        // Fits. If its content leaves it mostly empty, give some space back.
        const fill = (headerH + flow.height) / Math.max(1, innerH);
        minFill = Math.min(minFill, fill);
        if (fill < ROOMY_FILL) {
          anyRoomy = true;
          m.weight *= Math.max(0.6, fill / TARGET_FILL);
        }
      }

      // The category pill and the company pills are one block, centred in the tile:
      // the category alone on the first row, then the company rows, each row centred.
      const top = Math.max(0, (innerH - headerH - flow.height) / 2);
      const offsetY = top + headerH;
      const headerPillW = Math.min(
        innerW,
        Math.ceil(Math.max(...headerLines.map((l) => textWidth(l, headerSize, HEADER_WEIGHT))) + headerPillX),
      );
      tiles.push({
        category,
        rect,
        header: {
          lines: headerLines,
          fontSize: headerSize,
          padX: headerPadX,
          padY: headerPadY,
          x: padding + (innerW - headerPillW) / 2,
          y: padding + top,
          w: headerPillW,
          h: headerH - metrics.gapY,
        },
        pills: category.companies.map((company, j) => ({
          company,
          x: padding + flow.positions[j].x,
          y: padding + offsetY + flow.positions[j].y,
          w: widths[j],
        })),
      });
    });
    if (allFit) {
      if (!best || minFill > best.minFill) best = { tiles, minFill };
      if (!anyRoomy) break;
    }
  }
  if (best) return { metrics, tiles: best.tiles };
  return force ? { metrics, tiles } : null;
}

/**
 * Lays out a market map in `box`: one tile per category, sized by its content,
 * with company pills flowing inside. Uses the largest pill font size (between
 * MIN_FONT and MAX_FONT) at which every tile holds its header and pills.
 */
export function layoutMap(categories: Category[], box: { w: number; h: number }, gap: number): MapLayout | null {
  if (categories.length === 0 || box.w <= 0 || box.h <= 0) return null;

  const atMax = attempt(categories, box, gap, MAX_FONT);
  if (atMax) return { ...atMax, overflow: false };

  let lo = MIN_FONT;
  let hi = MAX_FONT;
  let best: ReturnType<typeof attempt> = null;
  for (let i = 0; i < 14 && hi - lo > 0.05; i++) {
    const mid = (lo + hi) / 2;
    const result = attempt(categories, box, gap, mid);
    if (result) {
      best = result;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  if (best) return { ...best, overflow: false };

  // Nothing fits even at the smallest size: draw it anyway and say so.
  return { ...attempt(categories, box, gap, MIN_FONT, true)!, overflow: true };
}
