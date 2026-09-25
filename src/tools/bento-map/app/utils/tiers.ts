import { fitText, textWidth } from './measureText';

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

export const NAME_WEIGHT = 600;
export const VALUE_WEIGHT = 500;

/** Below this the logo stops being recognisable, so text gets dropped instead. */
const MIN_LOGO = 32;
const LINE_HEIGHT = 1.15;

export interface TileContent {
  /** Logo beside the text (wide, short tiles) instead of above it. */
  horizontal: boolean;
  logoSize: number;
  padding: number;
  gap: number;
  /** Name as it fits, or null when the tile has no room for it. Rendered as a pill. */
  name: string | null;
  nameSize: number;
  /** Value text, or null when only the logo fits. */
  value: string | null;
  valueSize: number;
  pillPadX: number;
  pillPadY: number;
  /** Space between the name pill and the value. */
  textGap: number;
}

/**
 * Decides what a tile shows from its own pixel size, not the canvas size, so the
 * same rules hold at any canvas size and any number of companies.
 *
 * Every tile aims for logo + name pill + value. Logo and type scale with the tile;
 * on small tiles the logo shrinks to make room for the name pill and the value. Only when the
 * logo would drop below MIN_LOGO is text given up: the name first (it can be
 * shortened with "…" before that), then the value.
 */
export function tileContent(w: number, h: number, name: string, value: string): TileContent {
  const short = Math.min(w, h);
  const horizontal = w > h * 2.2;
  const padding = clamp(short * 0.08, 6, 24);
  const gap = clamp(short * 0.05, 4, 16);
  const innerW = w - padding * 2;
  const innerH = h - padding * 2;

  const valueSize = clamp(Math.sqrt(w * h) * 0.085, 20, 56);
  const nameSize = Math.max(17, valueSize * 0.72);

  const idealLogo = Math.min(clamp(short * 0.34, 44, 160), innerH, horizontal ? h * 0.7 : h * 0.5);

  // The name sits in a pill, so its box is the text plus padding and a 1px border.
  // Names are fitted to the width left inside the pill.
  const pillPadX = nameSize * 0.6;
  const pillPadY = nameSize * 0.22;
  const textGap = nameSize * 0.3;
  const pillChrome = pillPadX * 2 + 2;
  const pillH = nameSize * LINE_HEIGHT + pillPadY * 2 + 2;
  const fitName = (maxW: number) => fitText(name, maxW - pillChrome, nameSize, NAME_WEIGHT);
  const valueFits = (maxW: number) => textWidth(value, valueSize, VALUE_WEIGHT) <= maxW;

  const lines = (n: string | null, v: string | null) =>
    (n ? pillH : 0) + (v ? valueSize * LINE_HEIGHT : 0) + (n && v ? textGap : 0);
  const pill = { pillPadX, pillPadY, textGap };

  if (horizontal) {
    // Side by side: the logo keeps its size, the text gets the width that's left.
    const textW = innerW - idealLogo - gap;
    let fittedValue = valueFits(textW) ? value : null;
    let fittedName = fitName(textW);
    if (lines(fittedName, fittedValue) > innerH) fittedName = null;
    if (lines(fittedName, fittedValue) > innerH) fittedValue = null;
    return { horizontal, logoSize: Math.max(0, idealLogo), padding, gap, name: fittedName, nameSize, value: fittedValue, valueSize, ...pill };
  }

  // Stacked: text is as wide as the tile, and the logo takes the height left over.
  let fittedValue = valueFits(innerW) ? value : null;
  let fittedName = fitName(innerW);
  const logoRoom = () => {
    const textH = lines(fittedName, fittedValue);
    return innerH - (textH > 0 ? gap + textH : 0);
  };
  if (logoRoom() < MIN_LOGO) fittedName = null;
  if (logoRoom() < MIN_LOGO) fittedValue = null;

  return {
    horizontal,
    logoSize: Math.max(0, Math.min(idealLogo, logoRoom())),
    padding,
    gap,
    name: fittedName,
    nameSize,
    value: fittedValue,
    valueSize,
    ...pill,
  };
}
