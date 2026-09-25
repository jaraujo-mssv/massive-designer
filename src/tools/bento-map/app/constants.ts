import type { SizeOption } from '@/shared/canvas/DesignPanel';

/**
 * Example sheet behind "Load template" / "Open template spreadsheet". It must
 * stay shared as "Anyone with the link can view", or Load template fails.
 */
export const TEMPLATE_SHEET_URL =
  'https://docs.google.com/spreadsheets/d/1RPXro_8DAOgbYXVb01TXDqMkEk2NHdY_CbM7Jp2DExM/edit?usp=sharing';

export type BentoSizeId = 'square' | 'horizontal';

export const BENTO_SIZES: SizeOption<BentoSizeId>[] = [
  { id: 'square', label: 'Square', width: 1080, height: 1080 },
  { id: 'horizontal', label: 'Horizontal', width: 1920, height: 1080 },
];

export interface BentoPreset {
  sitePadding: number;
  headerBottomPadding: number;
  titleFontSize: number;
  subtitleFontSize: number;
  /** Smallest tile side, so every tile keeps room for its logo and value. */
  minTileSide: number;
  tileGap: number;
}

export const BENTO_PRESETS: Record<BentoSizeId, BentoPreset> = {
  square: {
    sitePadding: 56,
    headerBottomPadding: 28,
    titleFontSize: 44,
    subtitleFontSize: 32,
    minTileSide: 180,
    tileGap: 4,
  },
  horizontal: {
    sitePadding: 56,
    headerBottomPadding: 28,
    titleFontSize: 44,
    subtitleFontSize: 32,
    minTileSide: 190,
    tileGap: 4,
  },
};
