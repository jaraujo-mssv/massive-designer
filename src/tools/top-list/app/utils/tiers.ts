import type { LegibleSizes } from '@/shared/canvas/legibility';
import { fitText, textWidth, wrapLines, wrapTwoLines } from '@/shared/canvas/measureText';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// Heavier than body text: thin strokes are the first thing lost when a feed
// shrinks the image on a phone.
export const NAME_WEIGHT = 600;
export const VALUE_WEIGHT = 600;
export const DESCRIPTION_WEIGHT = 500;

/** A logo smaller than this many names-worth stops being recognisable, so text gets dropped instead. */
const MIN_LOGO_SCALE = 1.6;
/** A two-digit rank number is this share of its badge (RankBadge). */
export const RANK_TEXT_SHARE = 0.56;
/** A one-digit rank number is this share of its badge. */
export const RANK_TEXT_SHARE_ONE_DIGIT = 0.66;
/** Rank numbers may sit below other secondary text: the badge already makes them stand out. */
const RANK_TEXT_SCALE = 0.68;
/**
 * The share of the rank badge inside its item: the badge floats over the item's
 * top-left corner, with the rest over the gap.
 */
export const RANK_INSIDE = 0.7;
/** Badges grow with their item, up to this many times the smallest. */
const RANK_MAX_SCALE = 2.1;
const LINE_HEIGHT = 1.15;

/** The smallest rank badge, tiles and List rows alike. */
export function rankBadgeMin(legible: LegibleSizes): number {
  return (legible.secondary * RANK_TEXT_SCALE) / RANK_TEXT_SHARE;
}

/** The rank badge's diameter for an item (a List row or card) whose shorter side is `short`. */
export function rankBadgeSize(short: number, legible: LegibleSizes): number {
  const min = rankBadgeMin(legible);
  return clamp(short * 0.48, min, min * RANK_MAX_SCALE);
}

/**
 * A grid tile's rank badge: as `rankBadgeSize`, but never so big that the
 * smallest logo no longer fits between the badge and the tile's other side.
 */
export function tileRankSize(w: number, h: number, legible: LegibleSizes): number {
  const room = (w - legible.primary * MIN_LOGO_SCALE) / (2 * RANK_INSIDE);
  return Math.max(rankBadgeMin(legible), Math.min(rankBadgeSize(Math.min(w, h), legible), room));
}

export interface TileContent {
  /** Logo beside the text (wide, short tiles) instead of above it. */
  horizontal: boolean;
  logoSize: number;
  padding: number;
  gap: number;
  /**
   * The name as it fits, one or two lines, or null when the tile has no room
   * for it. Rendered as a pill.
   */
  nameLines: string[] | null;
  /** The name's font size; smaller than the tile's base size when that was needed to fit it. */
  nameSize: number;
  /** The description under the name, one or two lines, or null when it doesn't fit. */
  descriptionLines: string[] | null;
  descriptionSize: number;
  /** Value text, or null when only the logo fits. */
  value: string | null;
  valueSize: number;
  pillPadX: number;
  pillPadY: number;
  /** Space between the name pill, the description and the value. */
  textGap: number;
  /** Diameter of the rank badge floating over the tile's top-left corner (grid tiles), else 0. */
  rankSize: number;
}

/**
 * Decides what a tile shows from its own pixel size, not the canvas size, so the
 * same rules hold at any canvas size and any number of companies.
 *
 * Every tile aims for logo + name pill + value. Logo and type scale with the tile;
 * on small tiles the logo shrinks to make room for the name pill and the value.
 *
 * Names are shown in full wherever possible. In order of preference: one line,
 * two lines split at a word, then the same at smaller sizes down to
 * the phone-readable minimum (`legible.primary`), and only then one line
 * shortened with "…". Each option must still leave room for the logo. If none
 * does, the name is dropped, then the value: a tile never shows text smaller
 * than reads on a phone (`legible`).
 *
 * A `description` (see splitName) always shows when there is one, under the
 * name in smaller type, on up to two lines, then one shortened with "…". The
 * name takes its largest option that still leaves room for it, and the value
 * gives way before it does. A tile with no room for a name and its description
 * shows only its logo.
 *
 * Grid tiles pass `withRank`: the rank is a badge floating over the tile's
 * top-left corner (TileCanvas draws it), so the logo keeps clear of the part
 * inside the tile. The text under the logo always starts below it.
 * `fitW` is the tile's real width when sizes come from a different (regular)
 * tile: logo and type use `w`, but names get the full width to fit in.
 */
export function tileContent(
  w: number,
  h: number,
  name: string,
  value: string | null,
  withRank = false,
  fitW = w,
  description: string | null,
  /** Phone-readable minimums in canvas px (`legibleSizes`). */
  legible: LegibleSizes,
): TileContent {
  const MIN_NAME_SIZE = legible.primary;
  const MIN_LOGO = legible.primary * MIN_LOGO_SCALE;
  const short = Math.min(w, h);
  const horizontal = w > h * 2.2;
  const padding = clamp(short * 0.08, 6, 24);
  const gap = clamp(short * 0.05, 4, 16);
  const rankSize = withRank ? tileRankSize(w, h, legible) : 0;
  // The centred content keeps clear of the badge's part inside the tile, from the left
  // and the right alike.
  const corner = rankSize * RANK_INSIDE;
  const innerW = Math.min(w - padding * 2, w - corner * 2);
  const innerH = h - padding * 2;

  const valueSize = clamp(Math.sqrt(w * h) * 0.085, legible.secondary, Math.max(56, legible.secondary * 2));
  const baseNameSize = Math.max(MIN_NAME_SIZE, valueSize * 0.72);

  const idealLogo = Math.min(
    clamp(short * 0.34, Math.max(44, MIN_LOGO), Math.max(160, MIN_LOGO)),
    innerH,
    horizontal ? h * 0.7 : h * 0.5,
    innerW,
  );

  // The name sits in a pill (no border): its box is the text plus padding, and the
  // padding scales with the name's font size.
  const pillPadX = (size: number) => size * 0.6;
  const pillPadY = (size: number) => size * 0.22;
  const textGap = baseNameSize * 0.3;
  const descriptionSize = Math.max(legible.secondary, baseNameSize * 0.75);
  const valueFits = (maxW: number) => value !== null && textWidth(value, valueSize, VALUE_WEIGHT) <= maxW;

  interface NameFit {
    lines: string[];
    size: number;
  }
  /** Ways to show the name within `maxW`, best first (see the doc comment above). */
  const nameOptions = (maxW: number): NameFit[] => {
    // Base size, then 1px steps down, ending exactly on MIN_NAME_SIZE.
    const sizes: number[] = [];
    for (let size = baseNameSize; size > MIN_NAME_SIZE; size -= 1) sizes.push(size);
    sizes.push(MIN_NAME_SIZE);

    const options: NameFit[] = [];
    for (const size of sizes) {
      const room = maxW - pillPadX(size) * 2;
      if (textWidth(name, size, NAME_WEIGHT) <= room) options.push({ lines: [name], size });
      const wrapped = wrapTwoLines(name, room, size, NAME_WEIGHT);
      if (wrapped) options.push({ lines: wrapped, size });
    }
    const shortened = fitText(name, maxW - pillPadX(MIN_NAME_SIZE) * 2, MIN_NAME_SIZE, NAME_WEIGHT);
    if (shortened) options.push({ lines: [shortened], size: MIN_NAME_SIZE });
    return options;
  };

  /** The description's ways to fit in `maxW`, best first: two lines, then one shortened. */
  const descriptionOptions = (maxW: number): string[][] => {
    if (!description) return [];
    const options: string[][] = [];
    const wrapped = wrapLines(description, maxW, descriptionSize, DESCRIPTION_WEIGHT, 2);
    if (wrapped) options.push(wrapped);
    const shortened = fitText(description, maxW, descriptionSize, DESCRIPTION_WEIGHT);
    if (shortened && (!wrapped || wrapped.length > 1)) options.push([shortened]);
    return options;
  };

  const pillHeight = (n: NameFit) => n.lines.length * n.size * LINE_HEIGHT + pillPadY(n.size) * 2;
  const textHeight = (n: NameFit | null, v: string | null, d: string[] | null = null) => {
    const parts = [
      n ? pillHeight(n) : 0,
      d ? d.length * descriptionSize * LINE_HEIGHT : 0,
      v ? valueSize * LINE_HEIGHT : 0,
    ].filter((h) => h > 0);
    return parts.reduce((a, b) => a + b, 0) + Math.max(0, parts.length - 1) * textGap;
  };

  const result = (logoSize: number, n: NameFit | null, v: string | null, d: string[] | null = null): TileContent => ({
    horizontal,
    logoSize: Math.max(0, logoSize),
    padding,
    gap,
    nameLines: n?.lines ?? null,
    nameSize: n?.size ?? baseNameSize,
    descriptionLines: d,
    descriptionSize,
    value: v,
    valueSize,
    pillPadX: pillPadX(n?.size ?? baseNameSize),
    pillPadY: pillPadY(n?.size ?? baseNameSize),
    textGap,
    rankSize,
  });

  /**
   * The best name option that fits with the value `v`, and with a description
   * when there is one (its two lines, then one). `fits` says whether a choice
   * leaves the layout enough room.
   */
  const pick = (
    names: NameFit[],
    descriptions: string[][],
    v: string | null,
    fits: (n: NameFit, v: string | null, d: string[] | null) => boolean,
  ): { n: NameFit; d: string[] | null } | null => {
    for (const n of names) {
      if (!description) {
        if (fits(n, v, null)) return { n, d: null };
        continue;
      }
      const d = descriptions.find((option) => fits(n, v, option));
      if (d) return { n, d };
    }
    return null;
  };
  /** With the value if it fits, else without it (the value gives way before the description). */
  const pickWithValue = (
    textW: number,
    fits: (n: NameFit, v: string | null, d: string[] | null) => boolean,
  ): { n: NameFit | null; d: string[] | null; v: string | null } => {
    const names = nameOptions(textW);
    const descriptions = descriptionOptions(textW);
    const v = valueFits(textW) ? value : null;
    const withValue = pick(names, descriptions, v, fits);
    if (withValue) return { ...withValue, v };
    const withoutValue = v ? pick(names, descriptions, null, fits) : null;
    if (withoutValue) return { ...withoutValue, v: null };
    // No room for a name (and its description): the logo, and the value if it fits alone.
    return { n: null, d: null, v };
  };

  if (horizontal) {
    // Side by side: the logo keeps its size, the text gets the width that's left.
    const textW = innerW - idealLogo - gap;
    const fit = pickWithValue(textW, (n, v, d) => textHeight(n, v, d) <= innerH);
    const fittedValue = !fit.n && textHeight(null, fit.v) > innerH ? null : fit.v;
    return result(idealLogo, fit.n, fittedValue, fit.d);
  }

  // Stacked: text is as wide as the tile, and the logo takes the height left over,
  // but never less than MIN_LOGO.
  const textW = fitW - padding * 2;
  const logoRoom = (n: NameFit | null, v: string | null, d: string[] | null = null) => {
    const textH = textHeight(n, v, d);
    return innerH - (textH > 0 ? gap + textH : 0);
  };
  const fit = pickWithValue(textW, (n, v, d) => logoRoom(n, v, d) >= MIN_LOGO);
  const fittedValue = !fit.n && logoRoom(null, fit.v) < MIN_LOGO ? null : fit.v;

  return result(Math.min(idealLogo, logoRoom(fit.n, fittedValue, fit.d)), fit.n, fittedValue, fit.d);
}
