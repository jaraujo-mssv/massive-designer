import { textWidth, wrapLines } from '@/shared/canvas/measureText';
import { insetAndSnap, Rect, squarify } from '@/shared/canvas/squarify';
import type { Category, Company } from './parseSheet';
import { flowPills, pillMetrics, PillMetrics, pillWidth } from './pills';

/** Pill font sizes, in canvas pixels. Below MIN_READABLE pills are hard to read. */
export const MIN_READABLE = 11;
export const MAX_FONT = 24;
/** Where shrinking starts halving instead of searching; it never gives up. */
const SHRINK_FLOOR = 4;

/** How a map that doesn't fit at MIN_READABLE is made to fit. */
export type FitMode = 'shrink' | 'hide';

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

export interface HiddenGroup {
  category: string;
  names: string[];
}

export interface MapLayout {
  metrics: PillMetrics;
  tiles: PlacedTile[];
  /** False when pills had to shrink below MIN_READABLE to fit. */
  readable: boolean;
  /** Companies left out to fit ('hide' mode), by category. */
  hidden: HiddenGroup[];
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
 * emptiest tile is fullest, or null when no round fits.
 */
function attempt(categories: Category[], box: { w: number; h: number }, gap: number, f: number) {
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
    const widths = category.companies.map((c) => pillWidth(c.name, metrics, !c.more));
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
  return best ? { metrics, tiles: best.tiles } : null;
}

type Box = { w: number; h: number };
type Fitted = NonNullable<ReturnType<typeof attempt>>;

/** The largest pill size in [lo, hi] at which everything fits, or null. */
function largestFitting(categories: Category[], box: Box, gap: number, lo: number, hi: number): Fitted | null {
  const atHi = attempt(categories, box, gap, hi);
  if (atHi) return atHi;
  let best: Fitted | null = null;
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
  return best ?? attempt(categories, box, gap, lo);
}

/**
 * Hides `k` companies: one at a time, the last company of whichever category
 * has the most left (ties: the first in sheet order). Every category keeps at
 * least one company, and each trimmed category ends with a "+N more" pill.
 */
export function trimCategories(categories: Category[], k: number): { categories: Category[]; hidden: HiddenGroup[] } {
  const kept = categories.map((c) => [...c.companies]);
  const removed = categories.map(() => [] as Company[]);
  for (let i = 0; i < k; i++) {
    let pick = -1;
    kept.forEach((list, j) => {
      if (list.length > 1 && (pick === -1 || list.length > kept[pick].length)) pick = j;
    });
    if (pick === -1) break;
    removed[pick].unshift(kept[pick].pop()!);
  }
  return {
    categories: categories.map((c, j) =>
      removed[j].length === 0
        ? c
        : {
            ...c,
            companies: [
              ...kept[j],
              { id: `more-${c.id}`, name: `+${removed[j].length} more`, logoUrl: '', more: true },
            ],
          },
    ),
    hidden: categories
      .map((c, j) => ({ category: c.name, names: removed[j].map((co) => co.name) }))
      .filter((g) => g.names.length > 0),
  };
}

/**
 * Lays out a market map in `box`: one tile per category, sized by its content,
 * with company pills flowing inside, at the largest pill size (up to MAX_FONT)
 * where every tile holds its header and pills. Pills are never cut off:
 *
 * - If even MIN_READABLE doesn't fit, `shrink` keeps every company and goes
 *   below it (`readable: false`), and `hide` stays at MIN_READABLE and leaves
 *   out as few companies as it takes (see `trimCategories`).
 */
export function layoutMap(categories: Category[], box: Box, gap: number, fitMode: FitMode = 'shrink'): MapLayout | null {
  if (categories.length === 0 || box.w <= 0 || box.h <= 0) return null;

  const readable = largestFitting(categories, box, gap, MIN_READABLE, MAX_FONT);
  if (readable) return { ...readable, readable: true, hidden: [] };

  if (fitMode === 'hide') {
    // Fewest hidden companies that fit, by binary search, then step up in case
    // the search overshot (hiding more doesn't always help by exactly one pill).
    const total = categories.reduce((n, c) => n + c.companies.length, 0);
    const maxHide = total - categories.length;
    let lo = 1;
    let hi = maxHide;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (attempt(trimCategories(categories, mid).categories, box, gap, MIN_READABLE)) hi = mid;
      else lo = mid + 1;
    }
    for (let k = lo; k <= maxHide; k++) {
      const trimmed = trimCategories(categories, k);
      const fitted = attempt(trimmed.categories, box, gap, MIN_READABLE);
      if (fitted) return { ...fitted, readable: true, hidden: trimmed.hidden };
    }
    // Even one company per category doesn't fit readably: shrink instead.
  }

  const shrunk = largestFitting(categories, box, gap, SHRINK_FLOOR, MIN_READABLE);
  if (shrunk) return { ...shrunk, readable: false, hidden: [] };
  for (let f = SHRINK_FLOOR / 2; f > 0.25; f /= 2) {
    const tiny = attempt(categories, box, gap, f);
    if (tiny) return { ...tiny, readable: false, hidden: [] };
  }
  return null;
}
