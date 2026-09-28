import type { FrameSpacing } from './CanvasFrame';
import type { SizeOption } from './DesignPanel';

export type CanvasSizeId = 'vertical' | 'square' | 'horizontal';

/** Canvas sizes offered by the sheet-driven tools. */
export const CANVAS_SIZES: SizeOption<CanvasSizeId>[] = [
  { id: 'vertical', label: 'Vertical', width: 1080, height: 1350 },
  { id: 'square', label: 'Square', width: 1080, height: 1080 },
  { id: 'horizontal', label: 'Horizontal', width: 1920, height: 1080 },
];

export const DEFAULT_CANVAS_SIZE: CanvasSizeId = 'vertical';

/** Header spacing per size (the same for all three today). */
export const FRAME_SPACING: Record<CanvasSizeId, FrameSpacing> = {
  vertical: { sitePadding: 56, headerBottomPadding: 28, titleFontSize: 44, subtitleFontSize: 32 },
  square: { sitePadding: 56, headerBottomPadding: 28, titleFontSize: 44, subtitleFontSize: 32 },
  horizontal: { sitePadding: 56, headerBottomPadding: 28, titleFontSize: 44, subtitleFontSize: 32 },
};

/** Gap between tiles, in canvas pixels. */
export const TILE_GAP = 12;
