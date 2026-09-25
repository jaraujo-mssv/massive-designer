import type { LivePreset, RenderState } from '../types'
import { wave } from '../hash'

/**
 * Per-frame values that are constant across every pixel.
 *
 * These become uniforms. Anything that varies over time but not over space is
 * resolved here rather than in the shader, so the animation logic lives in one
 * readable place instead of GLSL.
 */
export interface FrameUniforms {
  brightness: number
  contrast: number
  gamma: number
  saturation: number
  invert: boolean
  spread: number
  /** Integer offsets into the threshold matrix, from `live.drift`. */
  driftX: number
  driftY: number
  noiseAmount: number
  noiseScale: number
  /** Integer time slice fed to the hash, so grain steps rather than smears. */
  noiseZ: number
}

/**
 * Folds time-varying animation into the flat parameter set the shader uses.
 * `state.time` of 0 (the default) yields exactly the preset's static values.
 */
export function resolveFrame(preset: LivePreset, state: RenderState = {}): FrameUniforms {
  const time = state.time ?? 0
  const live = preset.live

  let brightness = preset.brightness
  let contrast = preset.contrast
  let spread = preset.spread

  const wiggle = live?.wiggle
  if (wiggle && wiggle.speed !== 0) {
    const phase = time * wiggle.speed
    brightness += wiggle.brightness * wave(wiggle.wave, phase)
    contrast *= 1 + wiggle.contrast * wave(wiggle.wave, phase + wiggle.phase)
  }

  const scroll = live?.scroll
  if (scroll && scroll.mode === 'intensity') {
    spread *= 1 + scroll.strength * ((state.scroll ?? 0) - 0.5) * 2
  }

  const drift = live?.drift
  const noise = live?.noise

  return {
    brightness,
    contrast,
    gamma: preset.gamma,
    saturation: preset.saturation,
    invert: preset.invert,
    spread,
    driftX: drift ? Math.floor(drift.x * time) : 0,
    driftY: drift ? Math.floor(drift.y * time) : 0,
    noiseAmount: noise?.amount ?? 0,
    noiseScale: Math.max(1, noise?.scale ?? 1),
    noiseZ: noise ? Math.floor(noise.speed * time) : 0,
  }
}
