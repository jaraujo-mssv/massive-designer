# Translation notes: WhyAEOIsTheNewSEO

Ported from `remotion-playground/src/remotion/WhyAEOIsTheNewSEO.tsx` (1080x1080, 60 fps, 1080 frames).

## Approach

- The five `<Sequence>` slides (240 frames each, starting 210 frames apart) are sub-compositions at 0, 3.5, 7, 10.5 and 14 s. Each slide's `zIndex` became `z-index` on its host slot.
- The slide chrome (grid, eyebrow, content column) is static markup in each slide file. `js/aeo-slide.js` animates it from data attributes: `data-si` (stat scale-in), `.headline[data-delay]` (word stagger) and `.chrome` (blur fade).
- The springs keep their source configs: damping 22 / stiffness 200 for slide-ups, and 20 / 160 for scale-ins.

## Fidelity

SSIM against `remotion-playground/out/WhyAEOIsTheNewSEO.mp4`, with the baseline converted from full to limited range first:

| mean | min | p05 | p95 |
|---|---|---|---|
| 0.987 | 0.981 | 0.983 | 0.996 |

## Differences

- The giant stats have `line-height: 0.86`, so they overlap the headline box, and the decorations bleed off the edge. Both are in the original design, so they're marked `data-layout-allow-overlap` / `data-layout-allow-overflow` for `hyperframes check`.
