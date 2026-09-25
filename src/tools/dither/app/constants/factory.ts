import { definePreset, BLOG_DITHER } from '@/shared/dither/presets';
import { DEFAULT_DITHER_PRESET } from '@/shared/dither/preset-store';
import type { ColorMode, LiveParams, LivePreset } from '@/shared/dither/types';

/**
 * Starting points, carried over from the upstream tuner so a preset dialled in
 * there and one dialled in here start from the same places.
 */
export const FACTORY: LivePreset[] = [
  DEFAULT_DITHER_PRESET,
  BLOG_DITHER,
  definePreset({
    id: 'newsprint', name: 'Newsprint', scale: 2, matrix: 8, contrast: 1.2,
    color: { mode: 'duotone', ink: '#1a1a1a', paper: '#f4f1ea' },
  }),
  definePreset({
    id: 'xerox', name: 'Xerox', scale: 1, matrix: 4, spread: 0.9, contrast: 1.6,
    color: { mode: 'mono' },
  }),
  definePreset({
    id: 'blueprint', name: 'Blueprint', scale: 2, matrix: 4, contrast: 1.1,
    color: { mode: 'duotone', ink: '#0b2f6b', paper: '#dfe9f5' },
  }),
  definePreset({
    id: 'gameboy', name: 'Game Boy', scale: 3, matrix: 4, spread: 0.6, contrast: 1.15,
    color: { mode: 'palette', colors: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'] },
  }),
  definePreset({
    id: 'vga', name: 'VGA', scale: 2, matrix: 8, saturation: 1.2,
    color: { mode: 'rgb', levels: 4 },
  }),
  definePreset({
    id: 'signal', name: 'Signal', scale: 2, matrix: 8, contrast: 1.25,
    color: { mode: 'duotone', ink: '#101014', paper: '#ff4757' },
    live: {
      noise: { amount: 0.12, scale: 2, speed: 12, type: 'white' },
      wiggle: { wave: 'sine', speed: 0.35, brightness: 0.06, contrast: 0.18, phase: 0.25 },
      drift: { x: 0, y: -6 },
    },
  }),
];

/** What a live group is seeded with when it is switched on. */
export const LIVE_DEFAULTS: Required<Pick<LiveParams, 'noise' | 'wiggle' | 'drift'>> = {
  noise: { amount: 0.12, scale: 2, speed: 12, type: 'white' },
  wiggle: { wave: 'sine', speed: 0.4, brightness: 0.06, contrast: 0.15, phase: 0.25 },
  drift: { x: 0, y: -6 },
};

export const COLOR_DEFAULTS: Record<ColorMode['mode'], ColorMode> = {
  duotone: { mode: 'duotone', ink: '#0a0a0f', paper: '#d74939' },
  mono: { mode: 'mono' },
  palette: { mode: 'palette', colors: ['#12141c', '#4a5568', '#a3b1c6', '#f5f5f0'] },
  rgb: { mode: 'rgb', levels: 4 },
};

/** The site palette, one click away in duotone and palette modes. */
export const MASSIVE_SWATCHES = ['#0a0a0f', '#d74939', '#ff8163', '#faf4ec', '#2e2218', '#f5ece0'];

export const SAMPLES = [
  '/dither-samples/banner-1.jpg',
  '/dither-samples/banner-2.jpg',
  '/dither-samples/banner-3.jpg',
];
