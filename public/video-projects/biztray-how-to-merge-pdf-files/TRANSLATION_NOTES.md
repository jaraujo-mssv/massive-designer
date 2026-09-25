# Translation notes: How to merge PDF files

Rebuilt from `sparktray-campaign/content/biztray/scripts/guide-pdf-organizer-how-to-merge-pdf-files.md`, the way `sparktray-campaign/video/compositions/ScriptVideo.tsx` renders it (landscape, 1920x1080, 60 fps, subtitles off as in `video/Root.tsx`). No Remotion code or package was used: the source's `brand/ui` components are plain React with inline styles, and they were re-implemented as HTML-string renderers driven by `FrameKit.drive()`.

## Timing

- **One continuous take from 0 s** (`assets/voice/take-e02d335f.mp3`, 146.24 s). `brand/timing.ts` `takeTimings` places every beat at `round(cue.from × 60)` into that take, with no lead-in offset, so the `<audio>` starts at `data-start="0"`. The 3-frame volume ramp ScriptVideo uses as a click guard is a `data-automation` lane (0 → 1 over 0.05 s).
- **Length** is `round((take + OUTRO_SECONDS 1.2) × 60)` frames = 147.433333 s. The endcard holds 1.2 s past the last word.
- **Shots, not beats.** `brand/shots.ts` `sceneRuns` groups consecutive beats with the same scene (and, for backdrops, the same declaration) into one shot with one clock. Each shot is one sub-composition; `t = frame / (frames − 1)` across the whole shot, exactly as `Beat` computes it. Beat boundaries inside a shot are passed as frame offsets, which is what steps a backdrop (`backdrop.step`).
- **Top and tail**: ScriptVideo fades the whole picture over the first and last 8 frames. Here a black cover (`#…-toptail`) is driven from the root timeline with the same `interpolate(frame, [0, 8, D − 8, D − 1], [0, 1, 1, 0])`.
- Beats cut hard into each other, as in the source.

| Sub-composition | Scene | Start (s) | Duration (s) | Beats (beat @ start s) |
|---|---|---|---|---|
| `compositions/01-contrast.html` | `bg-contrast` | 0.000 | 22.133 | 1 @ 0.00s, 2 @ 6.37s, 3 @ 14.32s |
| `compositions/02-app-open.html` | `app-open` | 22.133 | 6.317 | 4 @ 22.13s |
| `compositions/03-app-pick.html` | `app-pick` | 28.450 | 5.950 | 5 @ 28.45s |
| `compositions/04-app-input.html` | `app-input` | 34.400 | 11.017 | 6 @ 34.40s, 7 @ 39.57s |
| `compositions/05-app-read.html` | `app-read` | 45.417 | 13.883 | 8 @ 45.42s, 9 @ 52.13s |
| `compositions/06-app-options.html` | `app-options` | 59.300 | 25.067 | 10 @ 59.30s, 11 @ 66.75s, 12 @ 72.65s, 13 @ 78.73s |
| `compositions/07-app-run.html` | `app-run` | 84.367 | 4.283 | 14 @ 84.37s |
| `compositions/08-app-queue.html` | `app-queue` | 88.650 | 7.167 | 15 @ 88.65s |
| `compositions/09-app-done.html` | `app-done` | 95.817 | 13.717 | 16 @ 95.82s, 17 @ 103.32s |
| `compositions/10-caveat.html` | `bg-caveat` | 109.533 | 23.483 | 18 @ 109.53s, 19 @ 115.88s, 20 @ 124.77s |
| `compositions/11-logo.html` | `logo` | 133.017 | 14.417 | 21 @ 133.02s, 22 @ 141.68s |

Cue points come from `sparktray-campaign/content/voice.json` and are copied, with word timings, into `voice.json` here.

## Shared files

The app window, the walkthrough director and every backdrop kind are written **once**, in `public/video-projects/_templates/js/`, and synced into each template project's `js/` by `node scripts/video/sync-brand.mjs` (it copies `_templates/js/*` into any project whose `meta.json` kind is `"template"`). **Do not edit `js/` here; edit the master and re-sync.**

- `js/tray-kit.js` (shared copy): tokens and brand accents (`brand/tokens.ts`, `brands.ts`), the window shell, sidebar, panes and desktop (`brand/ui/app/shell.tsx`), the step director (`app/director.ts`), SparkTray and BizTray panes and per-tool shots (`app/sparktray*.ts(x)`, `app/biztray*.ts(x)`), the backdrops `contrast`, `caveat`, `mechanism` (rail and store), `steps` and `scene` (`brand/ui/backdrop.tsx`, `backdrops/*`), and the `logo` endcard (`Scene.tsx` `Endcard`, `AppWindow.tsx`). `TrayKit.mount(id, { scene, brand, tool, frames, beats, items })` is the one entry point every composition calls.
- `js/tray-data.js` (shared copy, generated): lucide icon paths (every icon `brand/ui/lucide.ts` exports, from lucide-react 1.24, so backdrop payload tokens resolve the same way `iconFor` does), the SparkTray and BizTray flat tiles and dark lockups (`logo-data.ts`), the Windows 11 wallpaper as a data URI and the taskbar SVG (`brand/ui/windows/*-data.ts`). Everything is inline, so the picture needs no untracked media; only the voice take is in `media.json`.
- `lib/` comes from `_brand` as usual.

## Fidelity

SSIM (grayscale) against `sparktray-campaign/out/biztray-guide-pdf-organizer-how-to-merge-pdf-files.mp4` (Remotion, 60 fps, 147.43 s, same length as this project), sampled at 3, 18, 25, 31, 40, 50, 70, 86, 92, 100, 120 and 140 s: **0.987 to 0.995, mean 0.992**. The residual is font antialiasing and the reference's JPEG/H.264 compression.

Rendering notes:
- Each frame rebuilds only what changed: the app window's HTML (compared as a string, so a held pane is not touched), the backdrop's content layer, and the cursor position. Wallpaper, taskbar and tray are built once per shot.
- `frame-kit.css`'s border-box reset is kept on purpose: it matches the Remotion renders to the pixel (content-box made the window 2 px wider and dropped SSIM to about 0.93).
- Fonts: Inter 400 to 800 and JetBrains Mono 400 to 600 from Google Fonts. The Remotion composition only registers Inter; its mono text resolves to a locally installed JetBrains Mono, which is what the reference renders show.
- SVG ids inside the taskbar and the endcard wordmark are namespaced per composition, so the assembled page has no duplicate ids.

## Simplifications and gaps

- Subtitles are not drawn (off by default in the source). The caption band, karaoke timing and `Caption` are not ported.
- Only the pieces these guides need were ported: SparkTray and BizTray apps (all their tools), five backdrop kinds (no `bg-figure`), no standing-by desktop (no `text` beats here), no music bed or sign-off (the script sets neither).
- `hyperframes check` reports contrast warnings on the app's intentionally faint text (sidebar group labels, drop-zone hints, "(3)" counts, the organizer's page numbers). They are the source design's `fgGhost`/`fgDim` tokens and were left as authored.
