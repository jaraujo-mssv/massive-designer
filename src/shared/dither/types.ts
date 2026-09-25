/**
 * Public types for the ditherize engine.
 *
 * PORTED from `massive-new-landing/src/lib/ditherize/types.ts` — see
 * `../README.md`. Upstream ships two backends; only the WebGL2 **live** one is
 * carried here, so the ink (CPU, mono) types are absent.
 *
 * Presets are serialisable by design: the Dither tab exports a `LivePreset` as
 * a literal and it gets pasted straight into a constants file.
 */

/* -------------------------------------------------------------------------- */
/* Shared                                                                     */
/* -------------------------------------------------------------------------- */

/** Bayer matrices are square and power-of-two sized. */
export type BayerSize = 2 | 4 | 8 | 16

/**
 * Frame-varying inputs. All default to zero, which is what makes a still frame
 * (`render(0)` with no pointer) reproducible — and reproducibility is the whole
 * reason the baked social exports can be trusted.
 */
export interface RenderState {
  /** Seconds since the animation started. */
  time?: number
  /** Pointer position in normalised image space (0–1), plus whether it is over the image. */
  pointer?: { x: number; y: number; active: boolean }
  /** Scroll progress through the viewport, 0–1. */
  scroll?: number
}

/* -------------------------------------------------------------------------- */
/* Live backend (WebGL2)                                                      */
/* -------------------------------------------------------------------------- */

/** A hex colour string: `#rgb`, `#rrggbb` or `#rrggbbaa`. */
export type HexColor = string

/**
 * How quantised values are turned back into pixels.
 *
 * - `duotone` — two colours, chosen by dithered luminance. The default.
 * - `mono`    — pure black and white.
 * - `palette` — nearest colour from an arbitrary 2–16 entry palette.
 * - `rgb`     — each channel quantised independently; the classic VGA look.
 */
export type ColorMode =
  | { mode: 'duotone'; ink: HexColor; paper: HexColor }
  | { mode: 'mono' }
  | { mode: 'palette'; colors: HexColor[] }
  | { mode: 'rgb'; levels: number }

export type NoiseType = 'white' | 'perlin'
export type Waveform = 'sine' | 'triangle' | 'perlin'

/** Temporal grain injected before the threshold, making the pattern boil. */
export interface NoiseParams {
  /** 0–1. Amplitude of the perturbation. `0` disables it. */
  amount: number
  /** Size of a noise cell in output pixels. Larger is chunkier. */
  scale: number
  /** Cells per second of temporal change. `0` freezes the grain. */
  speed: number
  type: NoiseType
}

/** An LFO on brightness and contrast, making the pattern breathe. */
export interface WiggleParams {
  wave: Waveform
  /** Cycles per second. */
  speed: number
  /** 0–1. Peak brightness deviation. */
  brightness: number
  /** 0–1. Peak contrast deviation, as a fraction of the base contrast. */
  contrast: number
  /** 0–1. Phase offset of the contrast LFO relative to the brightness one. */
  phase: number
}

/** Scrolls the threshold matrix underneath a still image, in px/s. */
export interface DriftParams {
  x: number
  y: number
}

export type PointerMode = 'off' | 'intensity' | 'threshold' | 'reveal'

/**
 * A fading tail of recent pointer positions, so a fast sweep leaves a wake
 * instead of a single travelling spotlight.
 *
 * `length` and `duration` compose rather than fight: samples are recorded every
 * `duration / length` seconds, so the tail always spans exactly `duration` and
 * `length` decides how finely it is drawn. A trail keeps the render loop
 * running, since the tail has to age even when nothing else moves.
 */
export interface PointerTrailParams {
  /** 1–32. Positions kept behind the cursor. Higher is smoother and costlier. */
  length: number
  /** Seconds for a position to fade from full strength to nothing. */
  duration: number
  /** 0–1. How much the radius shrinks along the tail. `0` keeps it constant. */
  taper: number
}

/**
 * Pointer interaction. `reveal` fades the dithering away under the cursor,
 * exposing the untouched photograph; the other modes bend the dither itself.
 */
export interface PointerParams {
  mode: PointerMode
  /** Radius of influence, as a fraction of the image's height. */
  radius: number
  /** 0–1. How strongly the pointer bends the parameter it drives. */
  strength: number
  /** Omit for the plain spotlight the pointer had before trails existed. */
  trail?: PointerTrailParams
}

export type ScrollMode = 'off' | 'reveal' | 'intensity'

/** Scroll-progress interaction, driven by a 0–1 value supplied by the host. */
export interface ScrollParams {
  mode: ScrollMode
  strength: number
}

/** Animation parameters. All optional; a preset with none of them is a still. */
export interface LiveParams {
  noise?: NoiseParams
  wiggle?: WiggleParams
  drift?: DriftParams
  pointer?: PointerParams
  scroll?: ScrollParams
}

/** A dithering template for the live backend. Serialisable, versioned, and safe to commit. */
export interface LivePreset {
  id: string
  name: string
  version: 1
  /** 1–8. Box-filter downsample applied *before* dithering, for chunky pixels. */
  scale: number
  matrix: BayerSize
  /** 0–2. How far the threshold matrix pushes values around. */
  spread: number
  /** -1–1. Additive. */
  brightness: number
  /** 0–4. Multiplicative around mid grey. */
  contrast: number
  /** 0.1–4. */
  gamma: number
  /** 0–2. `0` is greyscale, `1` untouched. */
  saturation: number
  invert: boolean
  color: ColorMode
  live?: LiveParams
}

/** Anything accepted by `definePreset`; missing fields take defaults. */
export type LivePresetInput = Partial<LivePreset>
