# Dither engine

A port of `massive-new-landing/src/lib/ditherize` — the ordered-Bayer dither the
blog runs its banner images through. Same algorithm, same preset shape, so a
preset tuned here means the same thing there and vice versa.

## What was ported

| Here | Upstream |
|---|---|
| `types.ts` `bayer.ts` `hash.ts` `presets.ts` | same names |
| `live/{shader,renderer,frame,color}.ts` | same names |

Not ported: `ink.ts` (CPU mono backend, drives the hero video) and `tokens.ts`
(reads a `--dither-ink` CSS token that does not exist in this app). The ink
types and presets were stripped from `types.ts` / `presets.ts` with them.

Local additions, which have no upstream counterpart:

- `render-static.ts` — bakes a single deterministic frame to a PNG data URL.
  Everything in this app exports through `modern-screenshot`'s `domToBlob`,
  which snapshots the DOM; a live WebGL canvas does not survive that, so the
  templates hold a plain `<img>` instead.
- `useDitheredImage.ts` — the React hook over it.
- `RendererOptions.preserveDrawingBuffer` — the one edit to a ported file, so
  the bake can call `toDataURL()`. Defaults to `false`, i.e. upstream behaviour.

## Keeping the two in sync

Nothing enforces the mirror. Upstream `live/shader.ts` carries the reciprocal
warning (it is also mirrored into `tools/dither-tuner/index.html` there). A
change to the shader or the preset shape on either side has to be made on both,
or a preset stops predicting what the other renders.
