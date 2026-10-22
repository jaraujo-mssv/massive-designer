import type { LegibleSizes } from '@/shared/canvas/legibility';
import type { Rect } from '@/shared/canvas/squarify';
import { fitText, textWidth, wrapLines } from '@/shared/canvas/measureText';
import { DESCRIPTION_WEIGHT, NAME_WEIGHT, rankBadgeMin, VALUE_WEIGHT } from './tiers';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const LINE_HEIGHT = 1.15;
/** The name pill's padding, as a share of the name's font size. */
const PILL_PAD_X = 0.5;
const PILL_PAD_Y = 0.2;
/** A name pill is this many times its font size tall. */
const PILL_HEIGHT = LINE_HEIGHT + PILL_PAD_Y * 2;
/** Names grow with the row up to this many times the phone-readable minimum. */
const MAX_NAME_SCALE = 1.35;
/** The value may take at most this share of a row before it's shortened. */
const MAX_VALUE_SHARE = 0.4;
/** Row padding (top and bottom, left and right) at the smallest rows. */
const MIN_PADDING = 10;

const rowPadding = (h: number) => clamp(h * 0.12, MIN_PADDING, 28);

/** Up to this many companies sit in one column; more go into two. */
const ONE_COLUMN_MAX = 7;

/**
 * Full-width rows for the List layout, one per item, sharing the height
 * equally. Past ONE_COLUMN_MAX items the rows go into two columns, ranked
 * down the left column first, then the right.
 * Each column fills the full height, so with an odd count the right column's
 * rows are a little taller (TileCanvas sizes every row's content from the
 * shortest, so they still match).
 *
 * Returned in item order, the same Rect shape as `gridRects`, so both go
 * through `insetAndSnap`.
 */
export function listRects(count: number, bounds: Rect): { rects: Rect[]; columns: 1 | 2 } {
  if (count <= 0) return { rects: [], columns: 1 };
  const columns: 1 | 2 = count > ONE_COLUMN_MAX ? 2 : 1;
  const leftRows = Math.ceil(count / columns);
  const colW = bounds.w / columns;
  const rects: Rect[] = [];
  for (let i = 0; i < count; i++) {
    const col = i < leftRows ? 0 : 1;
    const row = col === 0 ? i : i - leftRows;
    const rowH = bounds.h / (col === 0 ? leftRows : count - leftRows);
    rects.push({ x: bounds.x + col * colW, y: bounds.y + row * rowH, w: colW, h: rowH });
  }
  return { rects, columns };
}

export interface ListRowContent {
  padding: number;
  gap: number;
  rankSize: number;
  logoSize: number;
  /** The name as it fits on one line (shortened with "…" if need be). Rendered as a pill. */
  name: string;
  nameSize: number;
  pillPadX: number;
  pillPadY: number;
  /** Up to two lines under the name, or null when there's no room for one. */
  descriptionLines: string[] | null;
  descriptionSize: number;
  /** Space between the name pill and the description. */
  textGap: number;
  /** The value, right-aligned or under the name (`valueBelow`), or null for none. */
  value: string | null;
  valueSize: number;
  /** The value sits under the name instead of on the right (lists in two columns). */
  valueBelow: boolean;
  /** The row was too short for a phone-readable name, so it's smaller than `legible.primary`. */
  shrunk: boolean;
}

/** `text` on up to two lines in `maxW`: wrapped when it fits, else the second line cut with "…". */
export function twoLines(text: string, maxW: number, size: number, weight: number): string[] | null {
  const wrapped = wrapLines(text, maxW, size, weight, 2);
  if (wrapped) return wrapped;
  const words = text.split(/\s+/).filter(Boolean);
  let i = 0;
  while (i < words.length && textWidth(words.slice(0, i + 1).join(' '), size, weight) <= maxW) i++;
  if (i === 0) {
    const one = fitText(text, maxW, size, weight);
    return one ? [one] : null;
  }
  const second = fitText(words.slice(i).join(' '), maxW, size, weight);
  return second ? [words.slice(0, i).join(' '), second] : [words.slice(0, i).join(' ')];
}

/**
 * Decides what a List row shows from its size: rank badge, logo, name pill
 * with the description under it, and the value on the right. With `valueBelow`
 * (two columns, too narrow for the value beside the name) the value goes
 * between the name and the description instead, and every row keeps room for
 * it. Every row of a list is sized from the same (shortest) row, so they all match.
 *
 * Sizes grow with the row up to a cap and stay at or above what reads on a
 * phone (`legible`). When the list has descriptions, every row keeps room for
 * one (`withDescription`): two lines if the name can stay at the minimum, else
 * one. Only a row too short even for that shrinks name and description
 * together below the minimum (`shrunk`). The value is kept whole (unless it's
 * very long text); the name gets the width left over, shrinking toward the
 * minimum before it's cut with "…".
 */
export function listRowContent(
  w: number,
  h: number,
  name: string,
  description: string | null,
  value: string | null,
  legible: LegibleSizes,
  /** The list has descriptions: keep room for one in every row, so rows look alike. */
  withDescription: boolean,
  /** The list's values go under the names: keep room for one in every row. */
  valueBelow = false,
): ListRowContent {
  const { primary, secondary } = legible;
  const padding = rowPadding(h);
  const innerH = h - padding * 2;
  const gap = clamp(h * 0.12, 8, 24);
  const minRank = rankBadgeMin(legible);
  const rankSize = Math.min(clamp(h * 0.25, minRank, Math.max(32, minRank * 1.15)), innerH);
  const logoSize = Math.min(clamp(h * 0.6, primary * 1.4, Math.max(84, primary * 2)), innerH);

  // Height first: the name pill (and the value under it) must fit in the row, even if that means going small.
  const descSizeFor = (size: number) => Math.max(secondary, size * 0.65);
  const valueSizeFor = (size: number) => Math.max(secondary, size * 0.9);
  /** The text column's height at name size `size`, with `lines` of description. */
  const stackH = (size: number, lines: number, descSize = descSizeFor(size), valueSize = valueSizeFor(size)) =>
    size * PILL_HEIGHT +
    (valueBelow ? size * 0.12 + valueSize * LINE_HEIGHT : 0) +
    (lines > 0 ? size * 0.12 + lines * descSize * LINE_HEIGHT : 0);
  const fits = (size: number, lines: number) => stackH(size, lines) <= innerH;
  let nameSize = clamp(h * 0.3, primary, primary * MAX_NAME_SCALE);
  let descriptionSize = descSizeFor(nameSize);
  let descLines = 0;
  let placed = false;
  // Two description lines, then one (none without descriptions), with the name made
  // smaller if need be, but not below the minimum.
  for (const lines of withDescription ? [2, 1] : [0]) {
    let size = nameSize;
    while (size > primary && !fits(size, lines)) size = Math.max(primary, size - 1);
    if (fits(size, lines)) {
      nameSize = size;
      descriptionSize = descSizeFor(size);
      descLines = lines;
      placed = true;
      break;
    }
  }
  if (!placed) {
    // Too short even at the minimums: name, value and one description line shrink together.
    descLines = withDescription ? 1 : 0;
    nameSize = innerH / stackH(1, descLines, 0.8, 0.9);
    descriptionSize = nameSize * 0.8;
  }
  const shrunk = nameSize < primary - 0.01;
  const valueSize = shrunk ? nameSize * 0.9 : valueSizeFor(nameSize);

  // A value on the right takes its width from the text column; one under the name is fitted to it below.
  let shownValue: string | null = null;
  let valueW = 0;
  if (value && !valueBelow) {
    shownValue = fitText(value, w * MAX_VALUE_SHARE, valueSize, VALUE_WEIGHT, 1) ?? value;
    valueW = textWidth(shownValue, valueSize, VALUE_WEIGHT);
  }

  // What's left for the text column: the name pill and the description (and the value under them).
  const textW = Math.max(0, w - padding * 2 - rankSize - logoSize - gap * 2 - (shownValue ? valueW + gap : 0));

  // Then width: shrink toward the minimum (never below it for width), then cut with "…".
  // The description keeps its size and lines, so every row's matches.
  const floor = Math.min(primary, nameSize);
  while (nameSize > floor && textWidth(name, nameSize, NAME_WEIGHT) + nameSize * PILL_PAD_X * 2 > textW) {
    nameSize = Math.max(floor, nameSize * 0.95);
  }
  const pillPadX = nameSize * PILL_PAD_X;
  const pillPadY = nameSize * PILL_PAD_Y;
  const shownName = fitText(name, textW - pillPadX * 2, nameSize, NAME_WEIGHT, 1) ?? `${name.charAt(0)}…`;

  // Indented to line up with the name's text; always shown when there is one.
  const descW = textW - pillPadX;
  if (value && valueBelow) shownValue = fitText(value, descW, valueSize, VALUE_WEIGHT, 1) ?? value;
  let descriptionLines: string[] | null = null;
  if (description && descLines === 2) {
    descriptionLines = twoLines(description, descW, descriptionSize, DESCRIPTION_WEIGHT);
  } else if (description && descLines === 1) {
    const one = fitText(description, descW, descriptionSize, DESCRIPTION_WEIGHT, 1);
    descriptionLines = one ? [one] : null;
  }

  return {
    padding,
    gap,
    rankSize,
    logoSize,
    name: shownName,
    nameSize,
    pillPadX,
    pillPadY,
    descriptionLines,
    descriptionSize,
    textGap: nameSize * 0.12,
    value: shownValue,
    valueSize,
    valueBelow,
    shrunk,
  };
}
