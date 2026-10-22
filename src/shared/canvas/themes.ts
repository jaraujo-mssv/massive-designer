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
  /**
   * Imitates the pre-revamp tools: their look and their layout (columns of
   * cards). Tools branch on this, never on the id.
   */
  legacy: boolean;
  exportBg: string;
}

export type CanvasThemeId = 'dark' | 'light' | 'dark-legacy' | 'light-legacy';

export const CANVAS_THEMES: CanvasTheme[] = [
  { id: 'dark', label: 'Dark', legacy: false, exportBg: '/bg.jpg' },
  { id: 'light', label: 'Light', legacy: false, exportBg: '/canvas-bg-light.jpg' },
  { id: 'dark-legacy', label: 'Dark Legacy', legacy: true, exportBg: '/bg.jpg' },
  { id: 'light-legacy', label: 'Light Legacy', legacy: true, exportBg: '/bg-light.jpg' },
];

export function getCanvasTheme(id: CanvasThemeId): CanvasTheme {
  return CANVAS_THEMES.find((t) => t.id === id) ?? CANVAS_THEMES[0];
}

/** The class that applies a theme's `--canvas-*` variables. */
export function canvasThemeClass(id: CanvasThemeId): string {
  return `canvas-${id}`;
}
