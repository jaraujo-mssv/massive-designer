import type { LegibleSizes } from '@/shared/canvas/legibility';
import type { Rect } from '@/shared/canvas/squarify';
import { fitText, textWidth, wrapLines } from '@/shared/canvas/measureText';
import { twoLines } from './list';
import { RANK_INSIDE, rankBadgeMin } from './tiers';

/**
 * The legacy themes' List (themes.ts `legacy`): the pre-revamp Top List's
 * columns of full-width cards, each with a logo, name and a value pill, and the
 * rank in a ring floating over its top-left corner. Cards keep their natural
 * height (the old tool never stretched them) and the block of columns is
 * centred in the canvas.
 *
 * Proportions are the old tool's, as multiples of its 18px names. Type and
 * logos follow the name size `f`; padding and gaps follow the canvas width as
 * the old 850px canvas had them, since readable names (`legible`) are bigger
 * than the old ones and spacing grown with them would squeeze the names.
 */

export const LEGACY_NAME_WEIGHT = 400;
export const LEGACY_VALUE_WEIGHT = 500;
export const LEGACY_DESCRIPTION_WEIGHT = 400;
export const LEGACY_LINE_HEIGHT = 1.2;

/** The old tool's names, and the width of its list (850px canvas, 80px padding each side). */
const OLD_NAME = 18;
const OLD_BODY_W = 690;

/** The rank badge's diameter, as a multiple of the name size. */
const RANK = 1.52;
const LOGO = 56 / 18;
const PAD_Y = 13 / 18;
const PAD_X = 16 / 18;
const GAP = 16 / 18;
const NAME_PAD = 4 / 18;
const VALUE = 13 / 18;
/** The value pill's padding, as a share of the value's font size. */
const VALUE_PAD_Y = 3 / 13;
const VALUE_PAD_X = 10 / 13;
const DESCRIPTION = 0.75;
/** The old cards' 2px stroke and 8px corners. */
const BORDER = 2;
const RADIUS = 8;
/** A logo smaller than this many names-worth stops being recognisable (as tiers.ts). */
const MIN_LOGO = 1.6;
/** Names grow up to this many times the phone-readable minimum (as list.ts). */
const MAX_NAME_SCALE = 1.35;
/** Up to this many companies sit in one column; more go into two, as the old tool's default. */
const ONE_COLUMN_MAX = 5;
const MAX_COLUMNS = 3;
/** A name gets at least this many names-worth of width before a third column is allowed. */
const MIN_NAME_ROOM = 4;
/** The value may take at most this share of a card before it's shortened. */
const MAX_VALUE_SHARE = 0.4;
/** Space between the name and a value pill under it, as a share of the name size. */
const VALUE_GAP = 0.2;

export interface LegacyCardMetrics {
  nameSize: number;
  /** A name too long for its card shrinks down to this before it's cut. */
  minNameSize: number;
  /** Diameter of the rank's ring (RankBadge), floating over the card's top-left corner. */
  rankSize: number;
  /** Where the logo starts: beside the ring's part inside the card, the same on every card. */
  lead: number;
  logo: number;
  padX: number;
  padY: number;
  gap: number;
  namePadX: number;
  valueSize: number;
  valuePadX: number;
  valuePadY: number;
  /** The value pill sits under the name instead of on the right (two or more columns). */
  valueBelow: boolean;
  /** Space between the name and a value pill under it. */
  valueGap: number;
  descriptionSize: number;
  maxNameLines: 1 | 2;
  showDescription: boolean;
  /** The name (and description) block's height, which the card's height allows for. */
  textHeight: number;
  border: number;
  radius: number;
}

export interface LegacyListLayout {
  /** One card per entry, in order: down the first column, then the next. */
  rects: Rect[];
  metrics: LegacyCardMetrics;
  columns: number;
  /** The cards were too short for a phone-readable name, so names are smaller than `legible.primary`. */
  shrunk: boolean;
}

/** What a legacy card needs from each entry to size the shared metrics. */
export interface LegacyListEntry {
  name: string;
  value: string | null;
}

/** A value pill's width, with its text shortened to fit `maxW` if need be. */
function valuePill(value: string, maxW: number, m: Pick<LegacyCardMetrics, 'valueSize' | 'valuePadX'>) {
  const chrome = m.valuePadX * 2 + 2;
  const text = fitText(value, maxW - chrome, m.valueSize, LEGACY_VALUE_WEIGHT, 1) ?? value;
  return { text, w: textWidth(text, m.valueSize, LEGACY_VALUE_WEIGHT) + chrome };
}

/**
 * Lays out the legacy List in `box`. The column count follows the old tool:
 * one column for a handful of companies, else two, and a third only when that
 * keeps cards readable and names have room. In each, names are as big as fits
 * (up to MAX_NAME_SCALE times readable) with every name on one line; at the
 * readable size, long names wrap, then shrink (down to the readable size for
 * secondary text), and only then are cut (legacyCardContent). Logos keep the old
 * proportions when there's room and shrink before text does; only when even
 * that doesn't fit does everything shrink below readable (`shrunk`). In two
 * or more columns the value pill goes under the name, leaving the name the
 * card's width.
 */
export function legacyListLayout(
  entries: LegacyListEntry[],
  box: { w: number; h: number },
  gap: number,
  { primary, secondary }: LegibleSizes,
  withDescriptions: boolean,
): LegacyListLayout | null {
  const count = entries.length;
  if (count === 0 || box.w <= 0 || box.h <= 0) return null;
  const columnGap = gap * 2;
  const cardGap = gap;
  const minRank = rankBadgeMin({ primary, secondary });
  const withValues = entries.some((e) => e.value);
  // Measured once at 100px, then scaled to each name size tried.
  const widestName = Math.max(...entries.map((e) => textWidth(e.name, 100, LEGACY_NAME_WEIGHT) / 100));
  // Spacing as the old canvas had it, relative to its width; smaller names shrink it too.
  const spacingFor = (f: number) => Math.min(f, (OLD_NAME * box.w) / OLD_BODY_W);

  const columnW = (n: number) => (box.w - (n - 1) * columnGap) / n;
  const rowsIn = (n: number) => Math.ceil(count / n);
  const heightPerCard = (n: number) => (box.h - (rowsIn(n) - 1) * cardGap) / rowsIn(n);

  /** Sizes for `n` columns at name size `f`, and the width a card has for its logo and name. */
  const sizesFor = (n: number, f: number, shrunk: boolean) => {
    const s = spacingFor(f);
    // Shrunk cards scale their secondary text along with the names.
    const floor = shrunk ? (secondary * f) / primary : secondary;
    const rankSize = Math.max(shrunk ? (minRank * f) / primary : minRank, RANK * f);
    const valueSize = Math.max(floor, VALUE * f);
    const m = {
      nameSize: f,
      minNameSize: Math.min(f, floor),
      rankSize,
      // Cards are too short for the logo to sit under the ring, so it starts beside it.
      lead: Math.max(PAD_X * s, rankSize * RANK_INSIDE + (GAP * s) / 2),
      padX: PAD_X * s,
      padY: PAD_Y * s,
      gap: GAP * s,
      namePadX: NAME_PAD * s,
      valueSize,
      valuePadX: VALUE_PAD_X * valueSize,
      valuePadY: VALUE_PAD_Y * valueSize,
      valueBelow: n > 1 && withValues,
      valueGap: VALUE_GAP * f,
      descriptionSize: Math.max(floor, DESCRIPTION * f),
      border: BORDER,
      radius: RADIUS,
    };
    const colW = columnW(n);
    // A value pill on the right takes its width from every name; one under the name takes its height.
    const valueW = m.valueBelow
      ? 0
      : Math.max(0, ...entries.map((e) => (e.value ? valuePill(e.value, colW * MAX_VALUE_SHARE, m).w + m.gap : 0)));
    const logoAndName = colW - BORDER * 2 - m.lead - m.padX - m.gap - valueW - m.namePadX * 2;
    const valuePillH = valueSize * LEGACY_LINE_HEIGHT + m.valuePadY * 2 + 2;
    const valueBelowH = m.valueBelow ? m.valueGap + valuePillH : 0;
    // The shortest card at this size: smallest logo, names on one line.
    const minCardH =
      BORDER * 2 + m.padY * 2 + Math.max(MIN_LOGO * f, f * LEGACY_LINE_HEIGHT + valueBelowH, valuePillH);
    return { m, logoAndName, valueBelowH, minCardH };
  };

  /** The metrics for `n` columns at name size `f`, in cards no taller than `H`. */
  const metricsFor = (n: number, f: number, H: number, shrunk: boolean): LegacyCardMetrics => {
    const { m, logoAndName, valueBelowH } = sizesFor(n, f, shrunk);
    const contentMax = H - BORDER * 2 - m.padY * 2;
    // The logo keeps the old proportions when there's room, and gives way so every
    // name fits on one line, down to the smallest recognisable logo.
    const nameW = widestName * f;
    const logo = Math.max(MIN_LOGO * f, Math.min(LOGO * spacingFor(f), contentMax, logoAndName - nameW));
    // Names that still don't fit wrap onto two lines when the card has the height
    // (the text, not the logo, then sets it), and descriptions get a line below.
    const lineH = f * LEGACY_LINE_HEIGHT;
    const descLineH = m.descriptionSize * LEGACY_LINE_HEIGHT;
    const maxNameLines = nameW > logoAndName - logo && contentMax >= lineH * 2 + valueBelowH ? 2 : 1;
    const showDescription = withDescriptions && contentMax >= lineH * maxNameLines + valueBelowH + descLineH;
    const textHeight = lineH * maxNameLines + valueBelowH + (showDescription ? descLineH : 0);
    return { ...m, logo, maxNameLines, showDescription, textHeight };
  };

  const place = (n: number, m: LegacyCardMetrics, shrunk: boolean): LegacyListLayout => {
    const rows = rowsIn(n);
    const colW = columnW(n);
    const valuePillH = m.valueSize * LEGACY_LINE_HEIGHT + m.valuePadY * 2 + 2;
    const cardH = BORDER * 2 + m.padY * 2 + Math.max(m.logo, m.textHeight, valuePillH);
    const blockH = rows * cardH + (rows - 1) * cardGap;
    const top = Math.max(0, (box.h - blockH) / 2);
    const rects = entries.map((_, i) => {
      const col = Math.floor(i / rows);
      const row = i - col * rows;
      const x0 = Math.round(col * (colW + columnGap));
      const x1 = Math.round(col * (colW + columnGap) + colW);
      const y0 = Math.round(top + row * (cardH + cardGap));
      const y1 = Math.round(top + row * (cardH + cardGap) + cardH);
      return { x: x0, y: y0, w: x1 - x0, h: y1 - y0 };
    });
    return { rects, metrics: m, columns: n, shrunk };
  };

  let lastN = 1;
  for (let n = count <= ONE_COLUMN_MAX ? 1 : 2; n <= Math.min(MAX_COLUMNS, count); n++) {
    // A third column only when names still get room beside a small logo.
    if (n === 3 && sizesFor(3, primary, false).logoAndName - MIN_LOGO * primary < MIN_NAME_ROOM * primary) break;
    lastN = n;
    const H = heightPerCard(n);
    if (sizesFor(n, primary, false).minCardH > H) continue;
    // The biggest names that fit the height with every name on one line; failing
    // that, readable names that wrap or are cut.
    let f = primary * MAX_NAME_SCALE;
    while (f > primary) {
      const { logoAndName, minCardH } = sizesFor(n, f, false);
      if (minCardH <= H && logoAndName - MIN_LOGO * f >= widestName * f) break;
      f = Math.max(primary, f * 0.95);
    }
    return place(n, metricsFor(n, f, H, false), false);
  }

  // Too many to read on a phone even with small logos: everything shrinks together.
  const H = heightPerCard(lastN);
  let f = primary;
  while (f > 1 && sizesFor(lastN, f, true).minCardH > H) f *= 0.95;
  return place(lastN, metricsFor(lastN, f, H, true), true);
}

export interface LegacyCardContent {
  nameLines: string[];
  /** The cards' name size, or smaller (down to `minNameSize`) so a long name isn't cut. */
  nameSize: number;
  description: string | null;
  value: string | null;
}

/**
 * What one legacy card shows at width `w`: the name on one or two lines, a
 * description line, the value. A name that doesn't fit at the cards' size
 * shrinks until it does, down to `minNameSize`, and only then is cut with "…".
 */
export function legacyCardContent(
  m: LegacyCardMetrics,
  w: number,
  name: string,
  description: string | null,
  value: string | null,
): LegacyCardContent {
  const textW = w - BORDER * 2 - m.lead - m.padX - m.logo - m.gap - m.namePadX * 2;
  // A pill under the name gets the name's width; one on the right takes from it.
  const pill = value ? valuePill(value, m.valueBelow ? textW : w * MAX_VALUE_SHARE, m) : null;
  const room = Math.max(0, textW - (pill && !m.valueBelow ? pill.w + m.gap : 0));
  const fitsAt = (size: number) =>
    textWidth(name, size, LEGACY_NAME_WEIGHT) <= room ||
    (m.maxNameLines === 2 && wrapLines(name, room, size, LEGACY_NAME_WEIGHT, 2) !== null);
  let nameSize = m.nameSize;
  while (nameSize > m.minNameSize && !fitsAt(nameSize)) nameSize = Math.max(m.minNameSize, nameSize * 0.97);
  const oneLine = () => [fitText(name, room, nameSize, LEGACY_NAME_WEIGHT, 1) ?? `${name.charAt(0)}…`];
  const nameLines =
    m.maxNameLines === 2 ? (twoLines(name, room, nameSize, LEGACY_NAME_WEIGHT) ?? oneLine()) : oneLine();
  return {
    nameLines,
    nameSize,
    description:
      m.showDescription && description
        ? fitText(description, room, m.descriptionSize, LEGACY_DESCRIPTION_WEIGHT, 1)
        : null,
    value: pill?.text ?? null,
  };
}
