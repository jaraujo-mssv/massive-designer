import { fitText, textWidth, wrapLines } from '@/shared/canvas/measureText';
import type { Rect } from '@/shared/canvas/squarify';
import { FitMode, HEADER_WEIGHT, HiddenGroup, SHRINK_FLOOR, trimCategories } from './layout';
import type { Category, Company } from './parseSheet';
import { PILL_WEIGHT } from './pills';

/**
 * The Columns layout: columns of category cards, each listing its companies
 * one per line, as the pre-revamp tool drew them. The old tool sized
 * everything by hand; here the column count and font size are picked
 * automatically, like the tiles.
 *
 * Two looks share the arrangement (`ColumnLook`): `legacy`, the old tool's
 * (filled cards, plain names; its proportions at 16px names as multiples of
 * the name size `f`), and `modern`, the Dark/Light themes' (no cards: plain
 * category names, a slim pill per company, rules between categories).
 */

export type ColumnLook = 'legacy' | 'modern';

export const COLUMN_LINE_HEIGHT = 1.2;
/**
 * Names grow up to this many times the readable size. More than the tiles'
 * 1.3: cards don't stretch to fill the canvas, so sparse maps get bigger type.
 */
const MAX_FONT_SCALE = 1.5;
/** Enough for Horizontal, where columns run out of height long before width. */
const MAX_COLUMNS = 8;
const MAX_HEADER_LINES = 3;
const MAX_NAME_LINES = 2;
/** A big category lists its companies in up to this many sub-columns, when its column is wide enough. */
const MAX_SUBCOLS = 3;
const MIN_ROWS_PER_SUBCOL = 4;
/** Spare height goes between rows first, up to this many times the row gap, then between cards (up to 2× the gap). */
const ROW_GAP_MAX = 3;
const CARD_GAP_MAX = 2;
/** Widths are measured once at 100px and scaled; this covers the rounding. */
const WIDTH_SLACK = 1.02;
/** Column counts whose font size is within this share of the best are compared by how well they fill the canvas. */
const TIE = 0.02;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export interface ColumnMetrics {
  look: ColumnLook;
  /** Company names; reported as the map's font size (FitInfo). */
  fontSize: number;
  nameWeight: number;
  /** "+N more" rows. */
  moreWeight: number;
  headerSize: number;
  headerWeight: number;
  /** The category name's padding, around its text. */
  headerPadX: number;
  headerPadY: number;
  logo: number;
  logoGap: number;
  /** A company row's padding: its pill's (modern), or none (legacy). */
  rowPadX: number;
  rowPadY: number;
  /** Padding either side of a name, inside the row. */
  namePadX: number;
  rowGap: number;
  /** Above and below a card's content, between its name and rows, and between its sub-columns. */
  padding: number;
  /** From a card's side edges to its content. */
  insetX: number;
  /** Added to the gap between columns. */
  gutter: number;
  border: number;
  radius: number;
}

function metricsAt(f: number, look: ColumnLook): ColumnMetrics {
  if (look === 'legacy') {
    const padding = clamp(f * 0.75, 12, 28);
    return {
      look,
      fontSize: f,
      nameWeight: 400,
      moreWeight: 500,
      headerSize: f,
      headerWeight: 700,
      headerPadX: 0,
      headerPadY: 0,
      logo: f * 1.5,
      logoGap: f * 0.75,
      rowPadX: 0,
      rowPadY: 0,
      namePadX: f * 0.25,
      rowGap: f * 0.25,
      padding,
      insetX: padding,
      gutter: 0,
      // The old cards' 3px stroke and 8px corners.
      border: 3,
      radius: 8,
    };
  }
  // No card: the name is plain text and the rows reach the column's edges, with
  // rules between categories (`separators`). The side padding moves into the
  // gutter, so a vertical rule has room either side. A row is slim: 1.7 names
  // tall with its gap, about the old tool's 1.75.
  const padding = clamp(f * 0.5, 8, 16);
  return {
    look,
    fontSize: f,
    nameWeight: PILL_WEIGHT,
    moreWeight: PILL_WEIGHT,
    headerSize: f * 1.1,
    headerWeight: HEADER_WEIGHT,
    headerPadX: 0,
    headerPadY: 0,
    logo: f * 1.2,
    logoGap: f * 0.35,
    rowPadX: f * 0.35,
    rowPadY: f * 0.14,
    namePadX: 0,
    rowGap: f * 0.22,
    padding,
    insetX: 0,
    gutter: padding * 2,
    border: 0,
    radius: 0,
  };
}

/** The rules between modern categories, in canvas pixels. */
const SEPARATOR = 2;

/** A company's line in a card; coordinates are inside the card's border. */
export interface ColumnRow {
  /** May be a "+N more" stand-in for hidden companies (`company.more`). */
  company: Company;
  x: number;
  y: number;
  w: number;
  h: number;
  /** The name on one or two lines, the last cut with "…" when it doesn't fit. */
  lines: string[];
}

export interface ColumnCard {
  category: Category;
  /** Border box, in the map's box, snapped to whole pixels. */
  rect: Rect;
  /** The category name, top left; coordinates inside the card's border. */
  header: { lines: string[]; x: number; y: number; w: number; h: number };
  rows: ColumnRow[];
}

export interface ColumnsLayout {
  metrics: ColumnMetrics;
  cards: ColumnCard[];
  /**
   * Modern look only: rules between categories stacked in a column, and
   * between columns (over the block's full height). Empty for legacy cards.
   */
  separators: Rect[];
  columns: number;
  /** False when names had to shrink below the readable size (`minFont`) to fit. */
  readable: boolean;
  /** Companies left out to fit ('hide' mode), by category. */
  hidden: HiddenGroup[];
}

type Box = { w: number; h: number };

/** Text widths at 1px, measured once per layout and scaled during the search. */
type UnitWidths = (text: string, weight: number) => number;

function unitWidths(): UnitWidths {
  const cache = new Map<string, number>();
  return (text, weight) => {
    const key = `${weight}|${text}`;
    let w = cache.get(key);
    if (w === undefined) {
      w = textWidth(text, 100, weight) / 100;
      cache.set(key, w);
    }
    return w;
  };
}

interface PlannedRow {
  company: Company;
  lines: string[];
  h: number;
}

/** A card measured for one font size and column width. */
interface PlannedCard {
  category: Category;
  header: string[];
  /** Sub-columns, and the row indexes in each (filled down, then across). */
  stacks: number[][];
  rows: PlannedRow[];
  /** Height without spare space, and the most row gaps in any sub-column. */
  h: number;
  rowGaps: number;
  /** The width its content needs, for comparing column counts. */
  naturalW: number;
}

const stackHeight = (rows: PlannedRow[], stack: number[], rowGap: number) =>
  stack.reduce((sum, i) => sum + rows[i].h, 0) + Math.max(0, stack.length - 1) * rowGap;

/** Room for a name beside its logo in a sub-column `subW` wide. */
const textRoom = (subW: number, m: ColumnMetrics) => subW - m.rowPadX * 2 - m.logo - m.logoGap - m.namePadX * 2;

const headerHeight = (lines: number, m: ColumnMetrics) => lines * m.headerSize * COLUMN_LINE_HEIGHT + m.headerPadY * 2;

/**
 * A name's lines in `maxW`: one, else two, else the words that fit on the
 * first line and the rest cut with "…", else one line cut; null when even
 * that's too short.
 */
function nameLines(company: Company, maxW: number, m: ColumnMetrics, unit: UnitWidths): string[] | null {
  const f = m.fontSize;
  const weight = company.more ? m.moreWeight : m.nameWeight;
  if (unit(company.name, weight) * f * WIDTH_SLACK <= maxW) return [company.name];
  const exactW = maxW / WIDTH_SLACK;
  if (!company.more) {
    const wrapped = wrapLines(company.name, exactW, f, weight, MAX_NAME_LINES);
    if (wrapped) return wrapped;
    const words = company.name.split(/\s+/).filter(Boolean);
    let i = 0;
    while (i < words.length && textWidth(words.slice(0, i + 1).join(' '), f, weight) <= exactW) i++;
    const rest = i > 0 && i < words.length ? fitText(words.slice(i).join(' '), exactW, f, weight, 4) : null;
    if (rest) return [words.slice(0, i).join(' '), rest];
  }
  const cut = fitText(company.name, exactW, f, weight, company.more ? 1 : 4);
  return cut ? [cut] : null;
}

function measureCard(category: Category, m: ColumnMetrics, colW: number, unit: UnitWidths): PlannedCard | null {
  const f = m.fontSize;
  const pad = m.padding;
  const innerW = colW - m.border * 2 - m.insetX * 2;
  if (textRoom(innerW, m) < f * 4) return null;

  const headerRoom = innerW - m.headerPadX * 2;
  const headerW = unit(category.name, m.headerWeight) * m.headerSize * WIDTH_SLACK;
  const header =
    headerW <= headerRoom
      ? [category.name]
      : wrapLines(category.name, headerRoom / WIDTH_SLACK, m.headerSize, m.headerWeight, MAX_HEADER_LINES);
  if (!header) return null;

  // Big categories split into sub-columns when every name still fits on one line.
  const companies = category.companies;
  const n = companies.length;
  const oneLineW = (c: Company) => unit(c.name, c.more ? m.moreWeight : m.nameWeight) * f * WIDTH_SLACK;
  const widest = Math.max(0, ...companies.map(oneLineW));
  let k = 1;
  for (let tryK = Math.min(MAX_SUBCOLS, Math.ceil(n / MIN_ROWS_PER_SUBCOL)); tryK >= 2; tryK--) {
    if (widest <= textRoom((innerW - (tryK - 1) * pad) / tryK, m)) {
      k = tryK;
      break;
    }
  }
  const subW = (innerW - (k - 1) * pad) / k;

  const rows: PlannedRow[] = [];
  for (const company of companies) {
    const lines = nameLines(company, textRoom(subW, m), m, unit);
    if (!lines) return null;
    rows.push({ company, lines, h: m.rowPadY * 2 + Math.max(m.logo, lines.length * f * COLUMN_LINE_HEIGHT) });
  }

  const perStack = Math.max(1, Math.ceil(n / k));
  const stacks: number[][] = [];
  for (let j = 0; j < k; j++) {
    const stack: number[] = [];
    for (let i = j * perStack; i < Math.min(n, (j + 1) * perStack); i++) stack.push(i);
    if (stack.length > 0) stacks.push(stack);
  }
  const blockH = Math.max(0, ...stacks.map((s) => stackHeight(rows, s, m.rowGap)));

  const rowChrome = m.rowPadX * 2 + m.logo + m.logoGap + m.namePadX * 2;
  const rowW = Math.max(0, ...rows.map((r) => rowChrome + Math.max(...r.lines.map((l) => unit(l, m.nameWeight) * f))));
  const headerLineW = Math.max(...header.map((l) => unit(l, m.headerWeight) * m.headerSize)) + m.headerPadX * 2;
  return {
    category,
    header,
    stacks,
    rows,
    h: m.border * 2 + pad * 3 + headerHeight(header.length, m) + blockH,
    rowGaps: Math.max(0, ...stacks.map((s) => s.length - 1)),
    naturalW: m.border * 2 + m.insetX * 2 + Math.max(headerLineW, stacks.length * rowW + (stacks.length - 1) * pad),
  };
}

/** Column height of `cards` stacked with `gap` between them. */
const columnHeight = (heights: number[], gap: number) =>
  heights.reduce((sum, h) => sum + h, 0) + Math.max(0, heights.length - 1) * gap;

/**
 * Cards into `n` columns: in sheet order, each into the shortest column so
 * far (ties: leftmost), so the first row reads left to right as the old
 * tool's did. `largestFirst` places the tallest cards first instead (the old
 * Auto-Adjust), then restores sheet order in each column.
 */
function pack(heights: number[], n: number, gap: number, largestFirst: boolean): number[][] {
  const cols: number[][] = Array.from({ length: n }, () => []);
  const colH = new Array(n).fill(0);
  const order = heights.map((_, i) => i);
  if (largestFirst) order.sort((a, b) => heights[b] - heights[a] || a - b);
  for (const i of order) {
    let pick = 0;
    for (let c = 1; c < n; c++) if (colH[c] < colH[pick] - 0.01) pick = c;
    colH[pick] += (cols[pick].length > 0 ? gap : 0) + heights[i];
    cols[pick].push(i);
  }
  if (largestFirst) cols.forEach((c) => c.sort((a, b) => a - b));
  return cols;
}

interface Attempt {
  m: ColumnMetrics;
  colW: number;
  /** Between columns: the gap plus the look's gutter. */
  colGap: number;
  cards: PlannedCard[];
  /** Card indexes per column, top to bottom. */
  cols: number[][];
  tallest: number;
}

/** What every try needs besides the font size and column count. */
interface Search {
  categories: Category[];
  box: Box;
  gap: number;
  look: ColumnLook;
  unit: UnitWidths;
}

/** Tries `n` columns at name size `f`; null when a card doesn't fit its column or a column is too tall. */
function attempt({ categories, box, gap, look, unit }: Search, f: number, n: number): Attempt | null {
  const m = metricsAt(f, look);
  const colGap = gap + m.gutter;
  const colW = (box.w - (n - 1) * colGap) / n;
  const cards: PlannedCard[] = [];
  for (const c of categories) {
    const card = measureCard(c, m, colW, unit);
    if (!card) return null;
    cards.push(card);
  }
  const heights = cards.map((c) => c.h);
  const tallestOf = (cols: number[][]) => Math.max(...cols.map((col) => columnHeight(col.map((i) => heights[i]), gap)));
  let cols = pack(heights, n, gap, false);
  let tallest = tallestOf(cols);
  if (tallest > box.h) {
    cols = pack(heights, n, gap, true);
    tallest = tallestOf(cols);
    if (tallest > box.h) return null;
  }
  return { m, colW, colGap, cards, cols, tallest };
}

/** The largest name size in [lo, hi] that fits in `n` columns, or null. */
function largestFitting(s: Search, n: number, lo: number, hi: number) {
  const atHi = attempt(s, hi, n);
  if (atHi) return atHi;
  let best: Attempt | null = null;
  for (let i = 0; i < 14 && hi - lo > 0.05; i++) {
    const mid = (lo + hi) / 2;
    const result = attempt(s, mid, n);
    if (result) {
      best = result;
      lo = mid;
    } else {
      hi = mid;
    }
  }
  return best ?? attempt(s, lo, n);
}

/**
 * The best arrangement with names in [lo, hi]: the column count that allows
 * the largest names; among counts within TIE of it, the one that fills the
 * canvas best (so a sparse map isn't one tall column of wide, empty cards,
 * nor one short row), then the fewest columns.
 */
function bestAt(s: Search, lo: number, hi: number): Attempt | null {
  const { box } = s;
  const candidates: Attempt[] = [];
  for (let n = 1; n <= Math.min(MAX_COLUMNS, s.categories.length); n++) {
    const fitted = largestFitting(s, n, lo, hi);
    if (fitted) candidates.push(fitted);
  }
  if (candidates.length === 0) return null;
  const fBest = Math.max(...candidates.map((c) => c.m.fontSize));
  const fill = (a: Attempt) => {
    const n = a.cols.length;
    const widthFill = Math.min(1, (n * Math.max(...a.cards.map((c) => c.naturalW)) + (n - 1) * a.colGap) / box.w);
    return Math.min(widthFill, a.tallest / box.h);
  };
  let best: Attempt | null = null;
  for (const c of candidates) {
    if (c.m.fontSize < fBest * (1 - TIE)) continue;
    if (!best || fill(c) > fill(best) + 1e-6) best = c;
  }
  return best;
}

/**
 * Places a fitting attempt: spare height in each column goes between rows,
 * then between cards (both capped, as the old tool's auto-gaps did), and the
 * block of columns is centred in what's left. In the modern look, a column
 * shorter than the tallest is centred too, so its spare room is shared above
 * and below instead of left as a gap at the bottom (legacy columns stay
 * top-aligned, as the old tool's were). Lines are checked again with exact
 * widths, so nothing overflows the scaled estimates. The modern look's rules
 * are centred in the gaps between cards and between columns.
 */
function finalize(a: Attempt, box: Box, gap: number, readable: boolean, hidden: HiddenGroup[]): ColumnsLayout {
  const { m, colW, colGap, cards, cols } = a;
  const pad = m.padding;
  const f = m.fontSize;

  const placed = cols.map((col) => {
    const colH = columnHeight(col.map((i) => cards[i].h), gap);
    const rowGaps = col.reduce((sum, i) => sum + cards[i].rowGaps, 0);
    const extraRow = rowGaps > 0 ? Math.min((box.h - colH) / rowGaps, (ROW_GAP_MAX - 1) * m.rowGap) : 0;
    const heights = col.map((i) => {
      const c = cards[i];
      const blockH = Math.max(0, ...c.stacks.map((s) => stackHeight(c.rows, s, m.rowGap + extraRow)));
      return m.border * 2 + pad * 3 + headerHeight(c.header.length, m) + blockH;
    });
    const spread = columnHeight(heights, gap);
    const extraCard = col.length > 1 ? Math.min(Math.max(0, box.h - spread) / (col.length - 1), (CARD_GAP_MAX - 1) * gap) : 0;
    return { col, heights, extraRow, extraCard, h: spread + extraCard * (col.length - 1) };
  });
  const blockH = Math.max(...placed.map((p) => p.h));
  const top = Math.max(0, (box.h - blockH) / 2);
  const ruled = m.look === 'modern';
  const separators: Rect[] = [];

  const out: ColumnCard[] = [];
  placed.forEach(({ col, heights, extraRow, extraCard, h }, c) => {
    const x0 = Math.round(c * (colW + colGap));
    const x1 = Math.round(c * (colW + colGap) + colW);
    if (ruled && c < placed.length - 1) {
      const x = Math.round(c * (colW + colGap) + colW + colGap / 2 - SEPARATOR / 2);
      separators.push({ x, y: Math.round(top), w: SEPARATOR, h: Math.round(blockH) });
    }
    let y = top + (ruled ? (blockH - h) / 2 : 0);
    let prevBottom: number | null = null;
    col.forEach((i, j) => {
      const card = cards[i];
      const y0 = Math.round(y);
      const y1 = Math.round(y + heights[j]);
      y += heights[j] + gap + extraCard;
      if (ruled && prevBottom !== null) {
        separators.push({ x: x0, y: Math.round((prevBottom + y0) / 2 - SEPARATOR / 2), w: x1 - x0, h: SEPARATOR });
      }
      prevBottom = y1;

      const rect = { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
      const innerW = rect.w - m.border * 2 - m.insetX * 2;
      const k = card.stacks.length;
      const subW = (innerW - (k - 1) * pad) / k;
      const room = textRoom(subW, m);
      const headerH = headerHeight(card.header.length, m);
      const headerW = Math.max(...card.header.map((l) => textWidth(l, m.headerSize, m.headerWeight))) + m.headerPadX * 2;

      const rows: ColumnRow[] = [];
      card.stacks.forEach((stack, s) => {
        let ry = pad + headerH + pad;
        for (const r of stack) {
          const row = card.rows[r];
          const weight = row.company.more ? m.moreWeight : m.nameWeight;
          // The search measured with scaled widths; cut any line that's a hair too wide.
          const lines = row.lines.map((l) => fitText(l, room, f, weight, 1) ?? l);
          rows.push({ company: row.company, x: m.insetX + s * (subW + pad), y: ry, w: subW, h: row.h, lines });
          ry += row.h + m.rowGap + extraRow;
        }
      });

      out.push({
        category: card.category,
        rect,
        header: { lines: card.header, x: m.insetX, y: pad, w: Math.min(innerW, Math.ceil(headerW)), h: headerH },
        rows,
      });
    });
  });

  return { metrics: m, cards: out, separators, columns: cols.length, readable, hidden };
}

/**
 * Lays out a market map in `box` as columns of category cards, at the largest
 * name size (up to minFont × MAX_FONT_SCALE) where every card fits. As in
 * `layoutMap`, names are never cut for space: if even `minFont` doesn't fit,
 * `shrink` keeps every company and goes below it (`readable: false`), and
 * `hide` stays at `minFont` and leaves out as few companies as it takes
 * (`trimCategories`, with "+N more" rows).
 */
export function layoutColumns(
  categories: Category[],
  box: Box,
  gap: number,
  fitMode: FitMode,
  /** The smallest name size that reads on a phone (`legibleSizes().primary`). */
  minFont: number,
  look: ColumnLook,
): ColumnsLayout | null {
  if (categories.length === 0 || box.w <= 0 || box.h <= 0) return null;
  const s: Search = { categories, box, gap, look, unit: unitWidths() };

  const readable = bestAt(s, minFont, minFont * MAX_FONT_SCALE);
  if (readable) return finalize(readable, box, gap, true, []);

  if (fitMode === 'hide') {
    const fitsAt = (cats: Category[]) => {
      for (let n = 1; n <= Math.min(MAX_COLUMNS, cats.length); n++) {
        if (attempt({ ...s, categories: cats }, minFont, n)) return true;
      }
      return false;
    };
    // Fewest hidden companies that fit, by binary search, then step up in case
    // the search overshot (as in layoutMap).
    const total = categories.reduce((n, c) => n + c.companies.length, 0);
    const maxHide = total - categories.length;
    let lo = 1;
    let hi = maxHide;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      if (fitsAt(trimCategories(categories, mid).categories)) hi = mid;
      else lo = mid + 1;
    }
    for (let k = lo; k <= maxHide; k++) {
      const trimmed = trimCategories(categories, k);
      const fitted = bestAt({ ...s, categories: trimmed.categories }, minFont, minFont);
      if (fitted) return finalize(fitted, box, gap, true, trimmed.hidden);
    }
    // Even one company per category doesn't fit readably: shrink instead.
  }

  const shrunk = bestAt(s, SHRINK_FLOOR, minFont);
  if (shrunk) return finalize(shrunk, box, gap, false, []);
  for (let f = SHRINK_FLOOR / 2; f > 0.25; f /= 2) {
    for (let n = 1; n <= Math.min(MAX_COLUMNS, categories.length); n++) {
      const tiny = attempt(s, f, n);
      if (tiny) return finalize(tiny, box, gap, false, []);
    }
  }
  return null;
}
