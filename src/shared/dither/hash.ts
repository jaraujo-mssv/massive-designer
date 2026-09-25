import type { Waveform } from './types'

/**
 * Integer hash, mirrored by `hash3` in the GLSL shader.
 *
 * `Math.imul` gives us the same wrapping 32-bit multiply GLSL's `uint`
 * arithmetic performs, and `>>>` matches GLSL's unsigned right shift, so the
 * integer stages are identical on both sides. Any "simplification" here that
 * reaches for `Math.random`, floats or `%` will silently desynchronise the two.
 *
 * The result is deliberately truncated to 24 bits before the divide. A GPU
 * `float` has a 24-bit mantissa, so a full 32-bit value would round on the way
 * out and diverge from JavaScript's 64-bit division.
 *
 * Determinism is load-bearing beyond the shader: it is what lets a paused frame
 * repaint identically, and what lets the Node-side poster render
 * (`npm run dither:poster`) match what the canvas draws.
 */
export function hash3(x: number, y: number, z: number): number {
  let h =
    (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(z | 0, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 8) / 16777216
}

/** Smoothstep-style fade, matching the shader's `fadeCurve()`. */
function fade(t: number): number {
  return t * t * (3 - 2 * t)
}

/**
 * Value noise in 2D + time. Not Perlin gradient noise, but the same visual
 * role — smooth, organic clumps instead of per-pixel static — while staying
 * trivially reproducible on the GPU.
 */
export function valueNoise3(x: number, y: number, z: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const xf = fade(x - xi)
  const yf = fade(y - yi)
  const zf = fade(z - zi)

  let result = 0
  for (let dz = 0; dz <= 1; dz++) {
    const wz = dz === 0 ? 1 - zf : zf
    for (let dy = 0; dy <= 1; dy++) {
      const wy = dy === 0 ? 1 - yf : yf
      for (let dx = 0; dx <= 1; dx++) {
        const wx = dx === 0 ? 1 - xf : xf
        result += hash3(xi + dx, yi + dy, zi + dz) * wx * wy * wz
      }
    }
  }
  return result
}

/** Oscillators for the wiggle LFO. All return -1..1. */
export function wave(shape: Waveform, phase: number): number {
  switch (shape) {
    case 'triangle': {
      const t = phase - Math.floor(phase)
      return 4 * Math.abs(t - 0.5) - 1
    }
    case 'perlin':
      return valueNoise3(phase, 0, 0) * 2 - 1
    case 'sine':
    default:
      return Math.sin(phase * Math.PI * 2)
  }
}
