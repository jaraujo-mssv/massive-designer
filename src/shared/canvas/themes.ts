/**
 * Canvas themes shared by the canvas tools.
 *
 * Each theme's colours live in src/styles/theme-canvas.css as a
 * `.canvas-<id>` class of `--canvas-*` variables. `exportBg` is the same image
 * as that class's `--canvas-export-bg-image`, repeated here because the JPG
 * export has to fetch it and inline it as a data URL (see exportJpg.ts).
 */
export interface CanvasTheme {
  id: CanvasThemeId;
  label: string;
  exportBg?: string;
}

export type CanvasThemeId = 'dark' | 'light';

export const CANVAS_THEMES: CanvasTheme[] = [
  { id: 'dark', label: 'Dark', exportBg: '/bg.jpg' },
  { id: 'light', label: 'Light', exportBg: '/bg-light.jpg' },
];

export function getCanvasTheme(id: CanvasThemeId): CanvasTheme {
  return CANVAS_THEMES.find((t) => t.id === id) ?? CANVAS_THEMES[0];
}

/** The class that applies a theme's `--canvas-*` variables. */
export function canvasThemeClass(id: CanvasThemeId): string {
  return `canvas-${id}`;
}
