import type { HexColor } from '../types'

/**
 * GL's colour representation: 0–1 components, tuple-shaped for a `uniform3f`.
 * Distinct from the ink backend's `Rgb`, which is a 0–255 object read from a
 * CSS token — see `types.ts`.
 */
export type Rgb01 = [number, number, number]

/**
 * Parses `#rgb`, `#rrggbb` and `#rrggbbaa` into 0–1 components.
 * Throws on anything else: a silently-black colour is far harder to debug than
 * a loud failure when someone fat-fingers a palette entry.
 */
const HEX_PATTERN = /^#?([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export function hexToRgb(hex: HexColor): Rgb01 {
  const match = HEX_PATTERN.exec(hex.trim())
  if (!match) throw new Error(`ditherize: invalid hex colour ${JSON.stringify(hex)}`)

  let body = match[1]
  if (body.length === 3) body = body[0] + body[0] + body[1] + body[1] + body[2] + body[2]

  return [
    parseInt(body.slice(0, 2), 16) / 255,
    parseInt(body.slice(2, 4), 16) / 255,
    parseInt(body.slice(4, 6), 16) / 255,
  ]
}
