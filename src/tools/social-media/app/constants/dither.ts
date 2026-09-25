import { Theme } from '../types';

export { getDitherPreset, DEFAULT_DITHER_PRESET } from '@/shared/dither/preset-store';

/**
 * The dither themes lay out the canvas themselves — a full-bleed image band and
 * a panel that paints its own background — so the wrappers in `DualCanvasLayout`
 * must keep their hands off the root's background for these two.
 */
export function isDitherTheme(theme: Theme): boolean {
  return theme === 'dither-light' || theme === 'dither-dark';
}

/**
 * Where the canvas is split, in export pixels. Held here rather than in
 * `templates.ts` because these are hard divisions of the canvas, not the
 * padding/gap dials `LayoutConfig` describes — and because the dithered image
 * is baked at exactly these dimensions, so they have to be numbers.
 *
 * Padding still comes from `getLayoutConfig`, so it lives in one place.
 */
export const DITHER_GEOMETRY = {
  linkedin: {
    /** Image band across the top of the 1350px canvas; the panel takes the rest. */
    imageWidth: 1080,
    imageHeight: 700,
  },
  twitter: {
    /** Panel left, image right, down the middle of the 1200px canvas. */
    panelWidth: 600,
    imageWidth: 600,
    imageHeight: 675,
  },
} as const;
