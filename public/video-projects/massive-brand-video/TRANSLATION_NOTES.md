# Translation notes: MassiveBrandVideo

Ported from `remotion-playground/src/remotion/MassiveBrandVideo.tsx` (1920x1080, 30 fps, 750 frames).

## Approach

- The eight `<Sequence>` scenes are sub-compositions back to back, from 0 to 25 s.
- `js/brand-scene.js` handles the shared moves from data attributes:
  - `up()`: spring 22/200, 36 px
  - `si()`: spring 20/160, 0.72 → 1
  - `wp()`: clip-path wipe
  - the corner brackets
- Scene-specific drawing (pulse rings, network graph, icons, arrow, rays) is a `render(frame)` callback in each scene file that keeps the source's math.
- The logo comes from `assets/brand/logo-white.svg` (committed) instead of the Webflow CDN URL, so renders need no network for it.

## Fidelity

SSIM against `remotion-playground/out/MassiveBrandVideo.mp4` averages 0.934 (min 0.874), **but that baseline is stale**:
- It was rendered on 2026-04-30, before commits 14aace6 (Outfit + JetBrains Mono, new Eyebrow) and a86679f (larger icons, darker background).
- The mismatch is the design drift between the two versions: the old baseline has a filled "Use Case" pill, Inter, and a small chart.

A visual check against the current source matches. Getting a meaningful score would need a fresh Remotion render of the current source, which we're avoiding because of licensing.

## Differences

- `hyperframes check` flags a 1.12:1 contrast on the "Massive" wordmark. That's a false positive: the text fill is a transparent gradient clip.
