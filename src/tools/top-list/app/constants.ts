import type { SizeOption } from '@/shared/canvas/DesignPanel';

export type TopListSizeId = 'vertical' | 'square' | 'horizontal';

export const SIZES: SizeOption<TopListSizeId>[] = [
  { id: 'vertical', label: 'Vertical', width: 1080, height: 1350 },
  { id: 'square', label: 'Square', width: 1080, height: 1080 },
  { id: 'horizontal', label: 'Horizontal', width: 1920, height: 1080 },
];

export const DEFAULT_SIZE: TopListSizeId = 'vertical';

export interface SizePreset {
  sitePadding: number;
  headerBottomPadding: number;
  titleFontSize: number;
  subtitleFontSize: number;
  /** Bento only: smallest tile side, so every tile keeps room for its logo and text. */
  minTileSide: number;
  tileGap: number;
}

export const PRESETS: Record<TopListSizeId, SizePreset> = {
  vertical: {
    sitePadding: 56,
    headerBottomPadding: 28,
    titleFontSize: 44,
    subtitleFontSize: 32,
    minTileSide: 180,
    tileGap: 12,
  },
  square: {
    sitePadding: 56,
    headerBottomPadding: 28,
    titleFontSize: 44,
    subtitleFontSize: 32,
    minTileSide: 180,
    tileGap: 12,
  },
  horizontal: {
    sitePadding: 56,
    headerBottomPadding: 28,
    titleFontSize: 44,
    subtitleFontSize: 32,
    minTileSide: 190,
    tileGap: 12,
  },
};

export interface Example {
  label: string;
  /** Which layout the sheet produces, shown next to its name. */
  hint: string;
  url: string;
}

/**
 * Example sheets listed under Import, each with Load and Open. The top lists
 * come from the Master Spreadsheet's Top Lists tab. They must stay shared as
 * "Anyone with the link can view", or Load fails.
 */
export const EXAMPLES: Example[] = [
  {
    label: 'AI Infrastructure',
    hint: 'Bento',
    url: 'https://docs.google.com/spreadsheets/d/1RPXro_8DAOgbYXVb01TXDqMkEk2NHdY_CbM7Jp2DExM/edit?usp=sharing',
  },
  {
    label: 'Top Frontier AI Labs',
    hint: 'Bento, from valuations',
    url: 'https://docs.google.com/spreadsheets/d/1YzwSpmhVROdUBmNX1--VVv3IbxyaF9IJp0u-j7y_da4/edit?usp=sharing',
  },
  {
    label: '10 Web Scraping APIs',
    hint: 'Grid',
    url: 'https://docs.google.com/spreadsheets/d/1GXCobV9IGahDOv17rM0r2HBzyXUF4v64EaX0mwfQCF0/edit',
  },
  {
    label: 'Top 10 AI SDRs',
    hint: 'Grid',
    url: 'https://docs.google.com/spreadsheets/d/1cdGR4qskMaQtDY0cIVhYozRdQdNCjEUa-QEZM6egST4/edit?usp=sharing',
  },
];
