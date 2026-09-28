import { textWidth, wrapTwoLines } from '@/shared/canvas/measureText';
import { insetAndSnap, Rect, squarify } from '@/shared/canvas/squarify';
import type { Category, Company } from './parseSheet';
import { flowPills, pillMetrics, PillMetrics, pillWidth } from './pills';

/** Pill font size range, in canvas pixels. */
export const MIN_FONT = 11;
export const MAX_FONT = 24;

export const HEADER_WEIGHT = 400;
const TILE_BORDER = 2;
const LINE_HEIGHT = 1.2;

export interface PlacedPill {
  company: Company;
  /** Inside the tile's padding box (the tile's border excluded). */
  x: number;
  y: number;
  w: number;
}

export interface PlacedTile {
  category: Category;
  rect: Rect;
  padding: number;
  headerLines: string[];
  headerSize: number;
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
  const headerSize = f * 1.15;
  const padding = Math.min(22, Math.max(10, f));
  return { metrics, headerSize, padding, headerGap: f * 0.7 };
}

/** Rounds of re-weighting before a font size is given up on. */
const MAX_ROUNDS = 12;

/**
 * Tries one pill font size: sizes each category's tile by its content, lays
 * the tiles out as a treemap, and flows the pills into them.
 *
 * The first weights are only estimates, so when a tile comes out too small for
 * its header and pills, its weight is raised by what it's short and the layout
 * runs again (up to MAX_ROUNDS). Returns null when it still doesn't fit, unless
 * `force`, which returns the last layout anyway.
 */
function attempt(categories: Category[], box: { w: number; h: number }, gap: number, f: number, force = false) {
  const { metrics, headerSize, padding, headerGap } = sizes(f);
  const chrome = padding * 2 + TILE_BORDER * 2;
  const headerLineH = headerSize * LINE_HEIGHT;

  // First estimate of the tile area each category needs: its pill boxes (with
  // slack for ragged rows) in a roughly square block, but never narrower than
  // its widest pill or half its header, which can wrap to two lines.
  const measured: Measured[] = categories.map((category) => {
    const widths = category.companies.map((c) => pillWidth(c.name, metrics));
    const pillArea = widths.reduce((sum, w) => sum + (w + metrics.gapX) * (metrics.height + metrics.gapY), 0) * 1.15;
    const minInnerW = Math.max(...widths, textWidth(category.name, headerSize, HEADER_WEIGHT) * 0.55);
    const innerW = Math.max(Math.sqrt(pillArea), minInnerW);
    const innerH = pillArea / innerW + headerLineH + headerGap;
    return { category, widths, weight: (innerW + chrome) * (innerH + chrome) };
  });

  // Extend the bounds by half a gap on every side so the outer tiles sit flush
  // with the box once each tile is inset by half a gap (as in Top List).
  const bounds = { x: -gap / 2, y: -gap / 2, w: box.w + gap, h: box.h + gap };

  let tiles: PlacedTile[] = [];
  for (let round = 0; round < MAX_ROUNDS; round++) {
    const order = [...measured].sort((a, b) => b.weight - a.weight);
    const totalWeight = order.reduce((sum, m) => sum + m.weight, 0);
    const areas = order.map((m) => (m.weight / totalWeight) * bounds.w * bounds.h);
    const rects = insetAndSnap(squarify(areas, bounds), gap);

    tiles = [];
    let allFit = true;
    order.forEach((m, i) => {
      const { category, widths } = m;
      const rect = rects[i];
      const innerW = rect.w - chrome;
      const innerH = rect.h - chrome;

      const headerW = textWidth(category.name, headerSize, HEADER_WEIGHT);
      const wrapped = headerW <= innerW ? null : wrapTwoLines(category.name, innerW, headerSize, HEADER_WEIGHT);
      const headerFits = headerW <= innerW || wrapped !== null;
      const headerLines = wrapped ?? [category.name];
      const headerH = headerLines.length * headerLineH + headerGap;
      const flow = flowPills(widths, innerW, metrics);

      if (!flow.fits || !headerFits) {
        // Too narrow for its widest pill or its header: grow in both directions.
        allFit = false;
        const needW = Math.max(...widths, headerFits ? 0 : headerW * 0.6);
        m.weight *= Math.max(1.1, ((needW + chrome) / Math.max(1, rect.w)) ** 2);
      } else if (headerH + flow.height > innerH) {
        // Wide enough but too short: grow by the missing height.
        allFit = false;
        m.weight *= Math.max(1.05, (headerH + flow.height + chrome) / Math.max(1, rect.h));
      }

      // Pills sit under the header, each row centred, the block centred in the height left over.
      const offsetY = headerH + Math.max(0, (innerH - headerH - flow.height) / 2);
      tiles.push({
        category,
        rect,
        padding,
        headerLines,
        headerSize,
        pills: category.companies.map((company, j) => ({
          company,
          x: padding + flow.positions[j].x,
          y: padding + offsetY + flow.positions[j].y,
          w: widths[j],
        })),
      });
    });
    if (allFit) return { metrics, tiles };
  }
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
