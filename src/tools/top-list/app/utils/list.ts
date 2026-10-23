import type { LegibleSizes } from '@/shared/canvas/legibility';
import type { Rect } from '@/shared/canvas/squarify';
import { fitText, textWidth, wrapLines } from '@/shared/canvas/measureText';
import { DESCRIPTION_WEIGHT, NAME_WEIGHT, RANK_INSIDE, rankBadgeSize, VALUE_WEIGHT } from './tiers';

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
/** Logos give way to long names by at most this share, before names shrink (listFit). */
const LOGO_GIVE = 0.2;
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
  /** Where the logo starts: the padding, or beside the rank badge when the logo would reach under it. */
  lead: number;
  gap: number;
  /** Diameter of the rank badge floating over the row's top-left corner. */
  rankSize: number;
  logoSize: number;
  /**
   * The name on one line, or on two when it doesn't fit on one and the row has
   * the height; the last line shortened with "…" if need be. Rendered as a pill.
   */
  nameLines: string[];
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

/** What a row's height allows, before its width is considered. */
interface RowMetrics {
  padding: number;
  innerH: number;
  gap: number;
  rankSize: number;
  /** Where the logo starts (ListRowContent). */
  lead: number;
  /** The logo before it gives way to long names. */
  logoSize: number;
  /** The largest name the row's height takes (with its description and value). */
  nameSize: number;
  descriptionSize: number;
  descLines: number;
  valueSize: number;
  shrunk: boolean;
  /** The text column's height at name size `size`, with `lines` of description. */
  stackH: (size: number, lines: number) => number;
}

/**
 * Height first: the name pill (and the value under it, and the description)
 * must fit in the row, even if that means going small. Every row of a list
 * has the same height, so this is the same for all of them.
 */
function rowMetrics(h: number, legible: LegibleSizes, withDescription: boolean, valueBelow: boolean): RowMetrics {
  const { primary, secondary } = legible;
  const padding = rowPadding(h);
  const innerH = h - padding * 2;
  const gap = clamp(h * 0.12, 8, 24);
  const rankSize = rankBadgeSize(h, legible);
  const logoSize = Math.min(clamp(h * 0.6, primary * 1.4, Math.max(84, primary * 2)), innerH);
  // The badge floats over the row's top-left corner: a logo that would reach under
  // its part inside the row starts beside it instead.
  const corner = rankSize * RANK_INSIDE;
  const lead = (h - logoSize) / 2 >= corner ? padding : Math.max(padding, corner + gap / 2);

  const descSizeFor = (size: number) => Math.max(secondary, size * 0.65);
  const valueSizeFor = (size: number) => Math.max(secondary, size * 0.9);
  const stackAt = (size: number, lines: number, descSize = descSizeFor(size), valueSize = valueSizeFor(size)) =>
    size * PILL_HEIGHT +
    (valueBelow ? size * 0.12 + valueSize * LINE_HEIGHT : 0) +
    (lines > 0 ? size * 0.12 + lines * descSize * LINE_HEIGHT : 0);
  const fits = (size: number, lines: number) => stackAt(size, lines) <= innerH;
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
    nameSize = innerH / stackAt(1, descLines, 0.8, 0.9);
    descriptionSize = nameSize * 0.8;
  }
  const shrunk = nameSize < primary - 0.01;
  const valueSize = shrunk ? nameSize * 0.9 : valueSizeFor(nameSize);
  return {
    padding,
    innerH,
    gap,
    rankSize,
    lead,
    logoSize,
    nameSize,
    descriptionSize,
    descLines,
    valueSize,
    shrunk,
    stackH: (size, lines) => stackAt(size, lines, descriptionSize, valueSize),
  };
}

/** A value on the right as shown (shortened if it's very long text) and its width. */
function rightValue(value: string | null, w: number, m: RowMetrics, valueBelow: boolean) {
  if (!value || valueBelow) return { text: null, width: 0 };
  const text = fitText(value, w * MAX_VALUE_SHARE, m.valueSize, VALUE_WEIGHT, 1) ?? value;
  return { text, width: textWidth(text, m.valueSize, VALUE_WEIGHT) };
}

/** The row's width beside its lead, padding, gap and (on the right) value: for the logo and the name pill. */
function logoAndText(w: number, m: RowMetrics, valueWidth: number): number {
  return w - m.lead - m.padding - m.gap - (valueWidth ? valueWidth + m.gap : 0);
}

/** The name and logo sizes every row of a list shares, so the rows match (listFit). */
export interface ListFit {
  nameSize: number;
  logoSize: number;
}

/**
 * The name size and logo size a whole list shares. Long names are made room
 * for in this order, all rows together: the logos give way (by up to
 * LOGO_GIVE), then the names shrink toward the phone-readable minimum (never
 * below it for width). A name that still doesn't fit at the end wraps onto
 * two lines in its row, or is cut, in `listRowContent`.
 */
export function listFit(
  rows: { name: string; value: string | null }[],
  w: number,
  h: number,
  legible: LegibleSizes,
  withDescription: boolean,
  valueBelow = false,
): ListFit {
  const m = rowMetrics(h, legible, withDescription, valueBelow);
  // Per row, the width for the logo and the name pill; the same at every name size.
  const room = rows.map((r) => ({ name: r.name, width: logoAndText(w, m, rightValue(r.value, w, m, valueBelow).width) }));
  const pill = (name: string, size: number) => textWidth(name, size, NAME_WEIGHT) + size * PILL_PAD_X * 2;

  // Logos first: as big as lets every name fit at the full size, giving up at most LOGO_GIVE.
  const minLogo = m.logoSize * (1 - LOGO_GIVE);
  const logo = Math.min(m.logoSize, ...room.map((r) => r.width - pill(r.name, m.nameSize)));
  if (logo >= minLogo) return { nameSize: m.nameSize, logoSize: logo };

  // Then names, all together, toward the minimum.
  const floor = Math.min(legible.primary, m.nameSize);
  const allFit = (size: number) => room.every((r) => pill(r.name, size) <= r.width - minLogo);
  let size = m.nameSize;
  while (size > floor && !allFit(size)) size = Math.max(floor, size * 0.95);
  return { nameSize: size, logoSize: minLogo };
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
 * very long text).
 *
 * The name and logo sizes are the list's (`fit`, from listFit). A name that
 * doesn't fit on one line at that size wraps onto two when the row's height
 * has room for the extra line, and only then is it cut with "…".
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
  /** The sizes the whole list shares; without it, the row fits on its own. */
  fit?: ListFit,
): ListRowContent {
  const m = rowMetrics(h, legible, withDescription, valueBelow);
  const { nameSize, logoSize } = fit ?? listFit([{ name, value }], w, h, legible, withDescription, valueBelow);
  const { descriptionSize, descLines, valueSize } = m;

  // A value on the right takes its width from the text column; one under the name is fitted to it below.
  const right = rightValue(value, w, m, valueBelow);
  let shownValue = right.text;

  // What's left for the text column: the name pill and the description (and the value under them).
  const textW = Math.max(0, logoAndText(w, m, right.width) - logoSize);
  const pillPadX = nameSize * PILL_PAD_X;
  const pillPadY = nameSize * PILL_PAD_Y;
  const nameRoom = textW - pillPadX * 2;

  // One line; else two, if the row has the height for the extra line; else one cut with "…".
  // The description and the value under the name keep their place either way.
  const cut = () => [fitText(name, nameRoom, nameSize, NAME_WEIGHT, 1) ?? `${name.charAt(0)}…`];
  let nameLines: string[];
  if (textWidth(name, nameSize, NAME_WEIGHT) <= nameRoom) nameLines = [name];
  else if (m.stackH(nameSize, descLines) + nameSize * LINE_HEIGHT <= m.innerH) {
    nameLines = twoLines(name, nameRoom, nameSize, NAME_WEIGHT) ?? cut();
  } else nameLines = cut();

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
    padding: m.padding,
    lead: m.lead,
    gap: m.gap,
    rankSize: m.rankSize,
    logoSize,
    nameLines,
    nameSize,
    pillPadX,
    pillPadY,
    descriptionLines,
    descriptionSize,
    textGap: nameSize * 0.12,
    value: shownValue,
    valueSize,
    valueBelow,
    shrunk: m.shrunk,
  };
}
