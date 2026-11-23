import type { LegibleSizes } from '@/shared/canvas/legibility';
import type { Rect } from '@/shared/canvas/squarify';
import { fitText, textWidth, wrapLines } from '@/shared/canvas/measureText';
import { ListRank, MAX_RANK_SHARE, NUMBER_GAP, NUMBER_LEAD, RankStyle, TAB_PAD, twoLines } from './list';
import { RANK_INSIDE, RANK_TEXT_SHARE, RANK_TEXT_SHARE_ONE_DIGIT, RANK_WEIGHT, rankBadgeMin } from './tiers';

/**
 * The legacy themes' List (themes.ts `legacy`): the pre-revamp Top List's
 * columns of full-width cards, each with a logo, name and a value pill, and the
 * rank in the style picked in the sidebar (RankStyle): a tab along the card's
 * left edge, a circle before the logo, a big number before the card, or the old
 * badge floating over its top-left corner. Cards keep their natural height (the
 * old tool never stretched them) and the block of columns is centred in the
 * canvas. With the badge, the gaps make room for it, so a badge keeps half a
 * gap clear of the card above it and the column to its left.
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

/** The rank badge's diameter, as a multiple of the name size; a circle in the card is the same. */
const RANK = 1.52;
/** A tab's number and a big number's size, as multiples of the name size. */
const TAB_NUMBER = 1.4;
const NUMBER = 2;
/** The most a tab, circle or numbers shrink to keep a long name from being cut, as a share of their size. */
const RANK_GIVE = 0.3;
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
  /** Diameter of the rank badge (RankBadge), floating over the card's top-left corner; 0 for the other rank styles. */
  rankSize: number;
  /** The ranks' style, number size and room: a tab or circle in the card, or numbers in a gutter before it. */
  rank: ListRank;
  /** Where the logo starts: beside the badge's part inside the card, or after a tab or circle; the same on every card. */
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
  rank: number;
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
 *
 * Ranks are sized from the name size too, and the same on every card. A tab,
 * circle or column of numbers takes at most MAX_RANK_SHARE of a column's width,
 * and gives way to a name that would otherwise be cut (by up to RANK_GIVE),
 * once the logo is at its smallest.
 */
export function legacyListLayout(
  entries: LegacyListEntry[],
  box: { w: number; h: number },
  gap: number,
  { primary, secondary }: LegibleSizes,
  withDescriptions: boolean,
  rankStyle: RankStyle,
): LegacyListLayout | null {
  const count = entries.length;
  if (count === 0 || box.w <= 0 || box.h <= 0) return null;
  const minRank = rankBadgeMin({ primary, secondary });
  // Shrunk cards scale their badges (and circles) along with the names. A circle may
  // give way to long names (`give`, below 1), but not below the smallest badge.
  const rankFor = (f: number, shrunk: boolean, give = 1) =>
    Math.max(shrunk ? (minRank * f) / primary : minRank, RANK * f * give);
  // Only the badge floats outside its card; the other styles take no room over the gaps.
  const badgeFor = (f: number, shrunk: boolean) => (rankStyle === 'badge' ? rankFor(f, shrunk) : 0);
  // A badge reaches this far over the gap above its card and the column gap to its left.
  const reach = (rankSize: number) => rankSize * (1 - RANK_INSIDE);
  // Without a badge, cards are a tile gap apart, as the modern List's rows.
  const cardGapFor = (rankSize: number) => (rankStyle === 'badge' ? gap / 2 + reach(rankSize) : gap);
  const columnGapFor = (rankSize: number) => Math.max(gap * 2, gap / 2 + reach(rankSize));
  // The widest rank number's width per px of font size (measured large, for accuracy).
  const widestRank = Math.max(0, ...entries.map((e) => textWidth(String(e.rank), 100, RANK_WEIGHT))) / 100;
  // One size for the whole list: two-digit lists size every circle's number for two digits.
  const circleShare = Math.max(0, ...entries.map((e) => e.rank)) >= 10 ? RANK_TEXT_SHARE : RANK_TEXT_SHARE_ONE_DIGIT;
  /**
   * The ranks at name size `f` in a column `colW` wide (all but the badge, which is
   * `rankSize`), at `give` times their size when they make room for a long name.
   */
  const rankIn = (f: number, shrunk: boolean, colW: number, give: number): ListRank => {
    const maxRoom = colW * MAX_RANK_SHARE * give;
    if (rankStyle === 'number') {
      const room = widestRank + NUMBER_GAP + NUMBER_LEAD;
      const fontSize = Math.min(NUMBER * f * give, maxRoom / room);
      return { style: rankStyle, fontSize, gutter: fontSize * room, box: 0 };
    }
    if (rankStyle === 'tab') {
      const fontSize = Math.min(TAB_NUMBER * f * give, maxRoom / (widestRank + TAB_PAD * 2));
      return { style: rankStyle, fontSize, gutter: 0, box: fontSize * (widestRank + TAB_PAD * 2) };
    }
    if (rankStyle === 'circle') {
      const d = Math.min(rankFor(f, shrunk, give), maxRoom);
      return { style: rankStyle, fontSize: d * circleShare, gutter: 0, box: d };
    }
    return { style: rankStyle, fontSize: 0, gutter: 0, box: 0 };
  };
  const withValues = entries.some((e) => e.value);
  // Measured once at 100px, then scaled to each name size tried.
  const widestName = Math.max(...entries.map((e) => textWidth(e.name, 100, LEGACY_NAME_WEIGHT) / 100));
  // Spacing as the old canvas had it, relative to its width; smaller names shrink it too.
  const spacingFor = (f: number) => Math.min(f, (OLD_NAME * box.w) / OLD_BODY_W);

  const columnW = (n: number, rankSize: number) => (box.w - (n - 1) * columnGapFor(rankSize)) / n;
  const rowsIn = (n: number) => Math.ceil(count / n);
  /** The height each card gets in `n` columns, at name size `f`. */
  const heightPerCard = (n: number, f: number, shrunk: boolean) =>
    (box.h - (rowsIn(n) - 1) * cardGapFor(badgeFor(f, shrunk))) / rowsIn(n);

  /** Sizes for `n` columns at name size `f`, and the width a card has for its logo and name. */
  const sizesFor = (n: number, f: number, shrunk: boolean, give = 1) => {
    const s = spacingFor(f);
    // Shrunk cards scale their secondary text along with the names.
    const floor = shrunk ? (secondary * f) / primary : secondary;
    const rankSize = badgeFor(f, shrunk);
    const colW = columnW(n, rankSize);
    const rank = rankIn(f, shrunk, colW, give);
    // Numbers sit in a gutter before each card, inside the column.
    const cardW = colW - rank.gutter;
    const valueSize = Math.max(floor, VALUE * f);
    const m = {
      nameSize: f,
      minNameSize: Math.min(f, floor),
      rankSize,
      rank,
      lead:
        rankStyle === 'tab'
          ? rank.box + GAP * s
          : rankStyle === 'circle'
            ? PAD_X * s + rank.box + GAP * s
            : rankStyle === 'number'
              ? PAD_X * s
              : // Cards are too short for the logo to sit under the badge, so it starts beside it.
                Math.max(PAD_X * s, rankSize * RANK_INSIDE + (GAP * s) / 2),
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
    // A value pill on the right takes its width from every name; one under the name takes its height.
    const valueW = m.valueBelow
      ? 0
      : Math.max(0, ...entries.map((e) => (e.value ? valuePill(e.value, cardW * MAX_VALUE_SHARE, m).w + m.gap : 0)));
    const logoAndName = cardW - BORDER * 2 - m.lead - m.padX - m.gap - valueW - m.namePadX * 2;
    const valuePillH = valueSize * LEGACY_LINE_HEIGHT + m.valuePadY * 2 + 2;
    const valueBelowH = m.valueBelow ? m.valueGap + valuePillH : 0;
    // The shortest card at this size: smallest logo, names on one line.
    const minCardH =
      BORDER * 2 + m.padY * 2 + Math.max(MIN_LOGO * f, f * LEGACY_LINE_HEIGHT + valueBelowH, valuePillH);
    return { m, logoAndName, valueBelowH, minCardH };
  };

  /** The metrics for `n` columns at name size `f`, in cards no taller than `H`. */
  const metricsFor = (n: number, f: number, H: number, shrunk: boolean): LegacyCardMetrics => {
    const full = sizesFor(n, f, shrunk);
    const contentMax = H - BORDER * 2 - full.m.padY * 2;
    const lineH = f * LEGACY_LINE_HEIGHT;
    // A name too long for one line even at its smallest beside the smallest logo, in a
    // card too short for two lines, would be cut: the tab, circle or numbers give way
    // first, just enough, by up to RANK_GIVE (1px spare for the cards' rounding).
    const fitsAtSmallest = (give: number) => {
      const { m, logoAndName } = sizesFor(n, f, shrunk, give);
      return logoAndName - MIN_LOGO * f >= widestName * m.minNameSize + 1;
    };
    let give = 1;
    if (rankStyle !== 'badge' && contentMax < lineH * 2 + full.valueBelowH) {
      while (give > 1 - RANK_GIVE && !fitsAtSmallest(give)) give = Math.max(1 - RANK_GIVE, give - 0.02);
    }
    const { m, logoAndName, valueBelowH } = give < 1 ? sizesFor(n, f, shrunk, give) : full;
    // The logo keeps the old proportions when there's room, and gives way so every
    // name fits on one line, down to the smallest recognisable logo.
    const nameW = widestName * f;
    const logo = Math.max(MIN_LOGO * f, Math.min(LOGO * spacingFor(f), contentMax, logoAndName - nameW));
    // Names that still don't fit wrap onto two lines when the card has the height
    // (the text, not the logo, then sets it), and descriptions get a line below.
    const descLineH = m.descriptionSize * LEGACY_LINE_HEIGHT;
    const maxNameLines = nameW > logoAndName - logo && contentMax >= lineH * 2 + valueBelowH ? 2 : 1;
    const showDescription = withDescriptions && contentMax >= lineH * maxNameLines + valueBelowH + descLineH;
    const textHeight = lineH * maxNameLines + valueBelowH + (showDescription ? descLineH : 0);
    return { ...m, logo, maxNameLines, showDescription, textHeight };
  };

  const place = (n: number, m: LegacyCardMetrics, shrunk: boolean): LegacyListLayout => {
    const rows = rowsIn(n);
    const colW = columnW(n, m.rankSize);
    const cardGap = cardGapFor(m.rankSize);
    const columnGap = columnGapFor(m.rankSize);
    const valuePillH = m.valueSize * LEGACY_LINE_HEIGHT + m.valuePadY * 2 + 2;
    const cardH = BORDER * 2 + m.padY * 2 + Math.max(m.logo, m.textHeight, valuePillH);
    const blockH = rows * cardH + (rows - 1) * cardGap;
    const top = Math.max(0, (box.h - blockH) / 2);
    const rects = entries.map((_, i) => {
      const col = Math.floor(i / rows);
      const row = i - col * rows;
      const x0 = Math.round(col * (colW + columnGap) + m.rank.gutter);
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
    if (sizesFor(n, primary, false).minCardH > heightPerCard(n, primary, false)) continue;
    // The biggest names that fit the height with every name on one line; failing
    // that, readable names that wrap or are cut.
    let f = primary * MAX_NAME_SCALE;
    while (f > primary) {
      const { logoAndName, minCardH } = sizesFor(n, f, false);
      if (minCardH <= heightPerCard(n, f, false) && logoAndName - MIN_LOGO * f >= widestName * f) break;
      f = Math.max(primary, f * 0.95);
    }
    return place(n, metricsFor(n, f, heightPerCard(n, f, false), false), false);
  }

  // Too many to read on a phone even with small logos: everything shrinks together until
  // the cards fit. A tab, circle or numbers take width the badge (over the gaps) doesn't,
  // so with them, also until the longest name fits on one line at its smallest beside a
  // small logo, rather than be cut.
  const tooBig = (f: number) => {
    if (sizesFor(lastN, f, true).minCardH > heightPerCard(lastN, f, true)) return true;
    // With the ranks given way as far as they go (metricsFor).
    const { logoAndName } = sizesFor(lastN, f, true, 1 - RANK_GIVE);
    return rankStyle !== 'badge' && logoAndName - MIN_LOGO * f < widestName * (secondary / primary) * f;
  };
  let f = primary;
  while (f > 1 && tooBig(f)) f *= 0.95;
  return place(lastN, metricsFor(lastN, f, heightPerCard(lastN, f, true), true), true);
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
