import type { FrameSpacing } from '@/shared/canvas/CanvasFrame';
import { CANVAS_SIZES, CanvasSizeId, DEFAULT_CANVAS_SIZE, FRAME_SPACING, TILE_GAP } from '@/shared/canvas/sizes';
import type { Example } from '@/shared/canvas/SheetSidebar';

export type TopListSizeId = CanvasSizeId;
export const SIZES = CANVAS_SIZES;
export const DEFAULT_SIZE = DEFAULT_CANVAS_SIZE;

export interface SizePreset extends FrameSpacing {
  /** Bento only: smallest tile side, so every tile keeps room for its logo and text. */
  minTileSide: number;
  tileGap: number;
}

export const PRESETS: Record<TopListSizeId, SizePreset> = {
  vertical: { ...FRAME_SPACING.vertical, minTileSide: 180, tileGap: TILE_GAP },
  square: { ...FRAME_SPACING.square, minTileSide: 180, tileGap: TILE_GAP },
  horizontal: { ...FRAME_SPACING.horizontal, minTileSide: 190, tileGap: TILE_GAP },
};

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
