import { definePreset } from './presets';
import type { LivePreset } from './types';

/**
 * The dither the Social Media templates ship with.
 *
 * Seeded from the blog's `BLOG_DITHER` (see `presets.ts`) with the interactive
 * parameters switched off — nothing in a baked PNG has a cursor to follow or a
 * scroll position to react to. Everything else is the blog treatment verbatim:
 * a 3× downsample into an 8×8 Bayer matrix, saturation pushed to 1.6, then
 * per-channel quantisation to 4 levels, which keeps the photograph's own colour
 * instead of recolouring it.
 *
 * Tune it in the Dither tab and paste that page's export over this literal
 * rather than hand-editing fields, so what ships is what was tuned.
 */
export const DEFAULT_DITHER_PRESET: LivePreset = definePreset({
  id: 'social-dither',
  name: 'Social Dither',
  scale: 3,
  matrix: 8,
  spread: 1,
  brightness: 0,
  contrast: 1,
  gamma: 1,
  saturation: 1.6,
  invert: false,
  color: { mode: 'rgb', levels: 4 },
  live: {
    pointer: { mode: 'off', radius: 0.2, strength: 0 },
    scroll: { mode: 'off', strength: 0 },
    noise: { amount: 0.05, scale: 1, speed: 20, type: 'perlin' },
  },
});

/** Where the Dither tab's "Save as default" lands. */
export const DITHER_PRESET_KEY = 'massive.designer.dither.preset';

/** Named presets kept alongside it, same as the upstream tuner's list. */
export const DITHER_LIBRARY_KEY = 'massive.designer.dither.library';

/**
 * Read once and held, because `getDitherPreset()` is called during render by
 * every dithered template. `null` means "not read yet", which is distinct from
 * a read that found nothing.
 */
let cached: LivePreset | null = null;

/** Runs a stored value back through `definePreset`, so a hand-edited or stale entry cannot break a render. */
function parse(raw: string | null): LivePreset | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return definePreset(parsed);
  } catch {
    return null;
  }
}

/** The preset the dither templates render with: the saved override, else the shipped default. */
export function getDitherPreset(): LivePreset {
  if (cached) return cached;
  try {
    cached = parse(localStorage.getItem(DITHER_PRESET_KEY)) ?? DEFAULT_DITHER_PRESET;
  } catch {
    cached = DEFAULT_DITHER_PRESET;
  }
  return cached;
}

export function saveDitherPreset(preset: LivePreset): void {
  cached = definePreset(preset);
  localStorage.setItem(DITHER_PRESET_KEY, JSON.stringify(cached));
}

export function clearDitherPreset(): void {
  cached = DEFAULT_DITHER_PRESET;
  localStorage.removeItem(DITHER_PRESET_KEY);
}

/** True when a saved override is in play, i.e. the shipped default is not what renders. */
export function hasSavedDitherPreset(): boolean {
  try {
    return localStorage.getItem(DITHER_PRESET_KEY) !== null;
  } catch {
    return false;
  }
}

// The Dither tab and the Social Media tool are separate routes but the same
// origin, so a save in one tab has to invalidate the other's copy.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === DITHER_PRESET_KEY) cached = null;
  });
}

export interface SavedDitherPreset {
  name: string;
  preset: LivePreset;
}

export function loadDitherLibrary(): SavedDitherPreset[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(DITHER_LIBRARY_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((entry) => entry && typeof entry.name === 'string' && entry.preset)
      .map((entry) => ({ name: entry.name as string, preset: definePreset(entry.preset) }));
  } catch {
    return [];
  }
}

export function saveDitherLibrary(entries: SavedDitherPreset[]): void {
  localStorage.setItem(DITHER_LIBRARY_KEY, JSON.stringify(entries));
}
