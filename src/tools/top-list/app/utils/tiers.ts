import { fitText, textWidth, wrapTwoLines } from './measureText';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const NAME_WEIGHT = 600;
export const VALUE_WEIGHT = 500;

/** Below this the logo stops being recognisable, so text gets dropped instead. */
const MIN_LOGO = 32;
/** Smallest a name may shrink to before it's shortened with "…". */
const MIN_NAME_SIZE = 12;
const LINE_HEIGHT = 1.15;

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
  /** Value text, or null when only the logo fits. */
  value: string | null;
  valueSize: number;
  pillPadX: number;
  pillPadY: number;
  /** Space between the name pill and the value. */
  textGap: number;
  /** Font size of the rank number in the corner (grid tiles). */
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
 * MIN_NAME_SIZE, and only then one line shortened with "…". Each option must
 * still leave room for the logo (MIN_LOGO). If none does, the name is dropped,
 * then the value.
 *
 * Grid tiles pass `value: null` and `withRank`: the rank sits in the top-left
 * corner, so the centred content gets that height kept clear above and below.
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
): TileContent {
  const short = Math.min(w, h);
  const horizontal = w > h * 2.2;
  const padding = clamp(short * 0.08, 6, 24);
  const gap = clamp(short * 0.05, 4, 16);
  const rankSize = clamp(short * 0.09, 14, 36);
  const rankClearance = withRank ? rankSize * 1.1 : 0;
  const innerW = w - padding * 2;
  const innerH = h - padding * 2 - rankClearance * 2;

  const valueSize = clamp(Math.sqrt(w * h) * 0.085, 20, 56);
  const baseNameSize = Math.max(17, valueSize * 0.72);

  const idealLogo = Math.min(clamp(short * 0.34, 44, 160), innerH, horizontal ? h * 0.7 : h * 0.5);

  // The name sits in a pill: its box is the text plus padding and a 1px border,
  // and the padding scales with the name's font size.
  const pillPadX = (size: number) => size * 0.6;
  const pillPadY = (size: number) => size * 0.22;
  const textGap = baseNameSize * 0.3;
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
      const room = maxW - pillPadX(size) * 2 - 2;
      if (textWidth(name, size, NAME_WEIGHT) <= room) options.push({ lines: [name], size });
      const wrapped = wrapTwoLines(name, room, size, NAME_WEIGHT);
      if (wrapped) options.push({ lines: wrapped, size });
    }
    const shortened = fitText(name, maxW - pillPadX(MIN_NAME_SIZE) * 2 - 2, MIN_NAME_SIZE, NAME_WEIGHT);
    if (shortened) options.push({ lines: [shortened], size: MIN_NAME_SIZE });
    return options;
  };

  const pillHeight = (n: NameFit) => n.lines.length * n.size * LINE_HEIGHT + pillPadY(n.size) * 2 + 2;
  const textHeight = (n: NameFit | null, v: string | null) =>
    (n ? pillHeight(n) : 0) + (v ? valueSize * LINE_HEIGHT : 0) + (n && v ? textGap : 0);

  const result = (logoSize: number, n: NameFit | null, v: string | null): TileContent => ({
    horizontal,
    logoSize: Math.max(0, logoSize),
    padding,
    gap,
    nameLines: n?.lines ?? null,
    nameSize: n?.size ?? baseNameSize,
    value: v,
    valueSize,
    pillPadX: pillPadX(n?.size ?? baseNameSize),
    pillPadY: pillPadY(n?.size ?? baseNameSize),
    textGap,
    rankSize,
  });

  if (horizontal) {
    // Side by side: the logo keeps its size, the text gets the width that's left.
    const textW = innerW - idealLogo - gap;
    let fittedValue = valueFits(textW) ? value : null;
    let fittedName = nameOptions(textW).find((n) => textHeight(n, fittedValue) <= innerH) ?? null;
    if (!fittedName && textHeight(null, fittedValue) > innerH) fittedValue = null;
    return result(idealLogo, fittedName, fittedValue);
  }

  // Stacked: text is as wide as the tile, and the logo takes the height left over.
  const textW = fitW - padding * 2;
  const logoRoom = (n: NameFit | null, v: string | null) => {
    const textH = textHeight(n, v);
    return innerH - (textH > 0 ? gap + textH : 0);
  };
  let fittedValue = valueFits(textW) ? value : null;
  const fittedName = nameOptions(textW).find((n) => logoRoom(n, fittedValue) >= MIN_LOGO) ?? null;
  if (!fittedName && logoRoom(null, fittedValue) < MIN_LOGO) fittedValue = null;

  return result(Math.min(idealLogo, logoRoom(fittedName, fittedValue)), fittedName, fittedValue);
}
