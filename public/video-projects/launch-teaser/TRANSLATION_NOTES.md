# Translation notes: LaunchTeaser

Ported from `remotion-playground/src/remotion/MassiveLaunchTeaser.tsx` (composition `LaunchTeaser`, 1920x1080, 30 fps, 180 frames).

## Approach

- Each Remotion `<Sequence>` is a sub-composition in `compositions/`, hosted at the same frame window (frames ÷ 30 = seconds).
- Each scene keeps its original per-frame math. `FrameKit.drive()` (`lib/frame-kit.js`) adds one linear tween to the scene's paused timeline and calls `render(frame)` on every seek, so springs, modulo pulses, sine bobbing and typewriter counts come out exactly as in the source.
- `interpolate` and `spring` are reimplemented in `lib/frame-kit.js`. The spring is the closed-form damped oscillator.
- The layering the source got from JSX order and `zIndex` now comes from `z-index` on the host slots. The vignette sits on top with `z-index: 100`.

## Differences

- There's no `out/LaunchTeaser.mp4` in remotion-playground, so this port has no SSIM score. It was checked visually against the source with `hyperframes snapshot`.
- `staticFile("brand/logo-positive-white.png")` became `assets/brand/logo-positive-white.png`, which is committed (a brand-asset exception).
- Typewriter lines and globe dots switch opacity instead of being left out of the DOM. The layout is the same because both are top-aligned or absolutely placed.
