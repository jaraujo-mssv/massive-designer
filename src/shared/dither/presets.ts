import type { LivePreset, LivePresetInput } from './types'

export const DEFAULT_PRESET: LivePreset = {
  id: 'default',
  name: 'Default',
  version: 1,
  scale: 1,
  matrix: 8,
  spread: 1,
  brightness: 0,
  contrast: 1,
  gamma: 1,
  saturation: 1,
  invert: false,
  color: { mode: 'duotone', ink: '#111111', paper: '#f5f5f0' },
}

/**
 * Fills in defaults and returns a complete preset.
 *
 * Use this rather than a bare object literal: presets are pasted in from the
 * tuning artifact, so a literal that only sets a few fields must still produce
 * something the renderer can execute.
 */
export function definePreset(input: LivePresetInput): LivePreset {
  return {
    ...DEFAULT_PRESET,
    ...input,
    version: 1,
    color: input.color ?? DEFAULT_PRESET.color,
    live: input.live,
  }
}

/**
 * The blog banner treatment, as shipped on massive.dev. Kept verbatim as the
 * reference point the social presets were seeded from — do not edit it to tune
 * the social templates; edit `DEFAULT_DITHER_PRESET` in the Social Media tool's
 * `constants/dither.ts` instead, via the Dither tab.
 */
export const BLOG_DITHER = definePreset({
  id: 'blog-custom-1',
  name: 'Blog Custom 1',
  scale: 3,
  matrix: 8,
  spread: 1,
  brightness: 0,
  contrast: 1,
  gamma: 1,
  saturation: 1.6,
  invert: false,
  // Per-channel quantisation, so the photograph keeps its own colour instead of
  // being recoloured — which is also why there is no light-theme counterpart
  // here: nothing in this preset is a theme token.
  color: { mode: 'rgb', levels: 4 },
  live: {
    pointer: {
      mode: 'threshold',
      radius: 0.2,
      strength: 1,
      trail: { length: 14, duration: 0.6, taper: 0.65 },
    },
    scroll: { mode: 'off', strength: 0.4 },
    noise: { amount: 0.05, scale: 1, speed: 20, type: 'perlin' },
  },
})
