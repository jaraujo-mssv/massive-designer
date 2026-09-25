# Translation notes: How to open a PPTX file without PowerPoint

Rebuilt from `sparktray-campaign/content/biztray/scripts/guide-office-to-pdf-how-to-open-a-pptx-file-without-powerpoint.md`, the way `sparktray-campaign/video/compositions/ScriptVideo.tsx` renders it (landscape, 1920x1080, 60 fps, subtitles off as in `video/Root.tsx`). No Remotion code or package was used: the source's `brand/ui` components are plain React with inline styles, and they were re-implemented as HTML-string renderers driven by `FrameKit.drive()`.

## Timing

- **One continuous take from 0 s** (`assets/voice/take-da762723.mp3`, 148.56 s). `brand/timing.ts` `takeTimings` places every beat at `round(cue.from × 60)` into that take, with no lead-in offset, so the `<audio>` starts at `data-start="0"`. The 3-frame volume ramp ScriptVideo uses as a click guard is a `data-automation` lane (0 → 1 over 0.05 s).
- **Length** is `round((take + OUTRO_SECONDS 1.2) × 60)` frames = 149.766667 s. The endcard holds 1.2 s past the last word.
- **Shots, not beats.** `brand/shots.ts` `sceneRuns` groups consecutive beats with the same scene (and, for backdrops, the same declaration) into one shot with one clock. Each shot is one sub-composition; `t = frame / (frames − 1)` across the whole shot, exactly as `Beat` computes it. Beat boundaries inside a shot are passed as frame offsets, which is what steps a backdrop (`backdrop.step`).
- **Top and tail**: ScriptVideo fades the whole picture over the first and last 8 frames. Here a black cover (`#…-toptail`) is driven from the root timeline with the same `interpolate(frame, [0, 8, D − 8, D − 1], [0, 1, 1, 0])`.
- Beats cut hard into each other, as in the source.

| Sub-composition | Scene | Start (s) | Duration (s) | Beats (beat @ start s) |
|---|---|---|---|---|
| `compositions/01-scene.html` | `bg-scene` | 0.000 | 17.933 | 1 @ 0.00s, 2 @ 5.20s, 3 @ 11.20s |
| `compositions/02-contrast.html` | `bg-contrast` | 17.933 | 17.033 | 4 @ 17.93s, 5 @ 27.47s |
| `compositions/03-mechanism.html` | `bg-mechanism` | 34.967 | 21.033 | 6 @ 34.97s, 7 @ 43.78s, 8 @ 49.28s |
| `compositions/04-app-input.html` | `app-input` | 56.000 | 12.233 | 9 @ 56.00s, 10 @ 61.48s |
| `compositions/05-app-options.html` | `app-options` | 68.233 | 27.883 | 11 @ 68.23s, 12 @ 77.42s, 13 @ 86.85s, 14 @ 89.58s |
| `compositions/06-app-run.html` | `app-run` | 96.117 | 4.383 | 15 @ 96.12s |
| `compositions/07-app-done.html` | `app-done` | 100.500 | 7.367 | 16 @ 100.50s |
| `compositions/08-caveat.html` | `bg-caveat` | 107.867 | 28.950 | 17 @ 107.87s, 18 @ 114.63s, 19 @ 121.88s, 20 @ 127.30s |
| `compositions/09-logo.html` | `logo` | 136.817 | 12.950 | 21 @ 136.82s, 22 @ 143.87s |

Cue points come from `sparktray-campaign/content/voice.json` and are copied, with word timings, into `voice.json` here.

## Shared files

The app window, the walkthrough director and every backdrop kind are written **once**, in `public/video-projects/_templates/js/`, and synced into each template project's `js/` by `node scripts/video/sync-brand.mjs` (it copies `_templates/js/*` into any project whose `meta.json` kind is `"template"`). **Do not edit `js/` here; edit the master and re-sync.**

- `js/tray-kit.js` (shared copy): tokens and brand accents (`brand/tokens.ts`, `brands.ts`), the window shell, sidebar, panes and desktop (`brand/ui/app/shell.tsx`), the step director (`app/director.ts`), SparkTray and BizTray panes and per-tool shots (`app/sparktray*.ts(x)`, `app/biztray*.ts(x)`), the backdrops `contrast`, `caveat`, `mechanism` (rail and store), `steps` and `scene` (`brand/ui/backdrop.tsx`, `backdrops/*`), and the `logo` endcard (`Scene.tsx` `Endcard`, `AppWindow.tsx`). `TrayKit.mount(id, { scene, brand, tool, frames, beats, items })` is the one entry point every composition calls.
- `js/tray-data.js` (shared copy, generated): lucide icon paths (every icon `brand/ui/lucide.ts` exports, from lucide-react 1.24, so backdrop payload tokens resolve the same way `iconFor` does), the SparkTray and BizTray flat tiles and dark lockups (`logo-data.ts`), the Windows 11 wallpaper as a data URI and the taskbar SVG (`brand/ui/windows/*-data.ts`). Everything is inline, so the picture needs no untracked media; only the voice take is in `media.json`.
- `lib/` comes from `_brand` as usual.

## Fidelity

SSIM (grayscale) against `sparktray-campaign/out/biztray-guide-office-to-pdf-how-to-open-a-pptx-file-without-powerpoint.mp4` (Remotion, 60 fps, 149.77 s, same length as this project), sampled at 8, 30, 45, 60, 75, 98, 104, 130 and 145 s: **0.987 to 0.996, mean 0.992**. The residual is font antialiasing and the reference's compression.

Rendering notes:
- Each frame rebuilds only what changed: the app window's HTML (compared as a string, so a held pane is not touched), the backdrop's content layer, and the cursor position. Wallpaper, taskbar and tray are built once per shot.
- `frame-kit.css`'s border-box reset is kept on purpose: it matches the Remotion renders to the pixel (content-box made the window 2 px wider and dropped SSIM to about 0.93).
- Fonts: Inter 400 to 800 and JetBrains Mono 400 to 600 from Google Fonts. The Remotion composition only registers Inter; its mono text resolves to a locally installed JetBrains Mono, which is what the reference renders show.
- SVG ids inside the taskbar and the endcard wordmark are namespaced per composition, so the assembled page has no duplicate ids.

## Simplifications and gaps

- Subtitles are not drawn (off by default in the source). The caption band, karaoke timing and `Caption` are not ported.
- Only the pieces these guides need were ported: SparkTray and BizTray apps (all their tools), five backdrop kinds (no `bg-figure`), no standing-by desktop (no `text` beats here), no music bed or sign-off (the script sets neither).
- `hyperframes check` reports contrast warnings on the app's intentionally faint text (sidebar group labels, drop-zone hints, "(3)" counts, the organizer's page numbers). They are the source design's `fgGhost`/`fgDim` tokens and were left as authored.
