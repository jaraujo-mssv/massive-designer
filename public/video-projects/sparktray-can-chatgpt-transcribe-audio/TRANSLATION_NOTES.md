# Translation notes: Can ChatGPT transcribe audio?

Rebuilt from `sparktray-campaign/content/sparktray/scripts/guide-transcriber-can-chatgpt-transcribe-audio.md`, the way `sparktray-campaign/video/compositions/ScriptVideo.tsx` renders it (landscape, 1920x1080, 60 fps, subtitles off as in `video/Root.tsx`). No Remotion code or package was used: the source's `brand/ui` components are plain React with inline styles, and they were re-implemented as HTML-string renderers driven by `FrameKit.drive()`.

## Timing

- **One continuous take from 0 s** (`assets/voice/take-63531328.mp3`, 144.96 s). `brand/timing.ts` `takeTimings` places every beat at `round(cue.from × 60)` into that take, with no lead-in offset, so the `<audio>` starts at `data-start="0"`. The 3-frame volume ramp ScriptVideo uses as a click guard is a `data-automation` lane (0 → 1 over 0.05 s).
- **Length** is `round((take + OUTRO_SECONDS 1.2) × 60)` frames = 146.166667 s. The endcard holds 1.2 s past the last word.
- **Shots, not beats.** `brand/shots.ts` `sceneRuns` groups consecutive beats with the same scene (and, for backdrops, the same declaration) into one shot with one clock. Each shot is one sub-composition; `t = frame / (frames − 1)` across the whole shot, exactly as `Beat` computes it. Beat boundaries inside a shot are passed as frame offsets, which is what steps a backdrop (`backdrop.step`).
- **Top and tail**: ScriptVideo fades the whole picture over the first and last 8 frames. Here a black cover (`#…-toptail`) is driven from the root timeline with the same `interpolate(frame, [0, 8, D − 8, D − 1], [0, 1, 1, 0])`.
- Beats cut hard into each other, as in the source.

| Sub-composition | Scene | Start (s) | Duration (s) | Beats (beat @ start s) |
|---|---|---|---|---|
| `compositions/01-mechanism.html` | `bg-mechanism` | 0.000 | 21.483 | 1 @ 0.00s, 2 @ 8.17s, 3 @ 14.13s |
| `compositions/02-steps.html` | `bg-steps` | 21.483 | 17.133 | 4 @ 21.48s, 5 @ 30.32s |
| `compositions/03-contrast.html` | `bg-contrast` | 38.617 | 26.767 | 6 @ 38.62s, 7 @ 44.17s, 8 @ 52.03s, 9 @ 56.72s |
| `compositions/04-app-input.html` | `app-input` | 65.383 | 13.833 | 10 @ 65.38s, 11 @ 71.60s |
| `compositions/05-app-options.html` | `app-options` | 79.217 | 15.450 | 12 @ 79.22s, 13 @ 85.62s |
| `compositions/06-app-run.html` | `app-run` | 94.667 | 4.450 | 14 @ 94.67s |
| `compositions/07-app-done.html` | `app-done` | 99.117 | 6.017 | 15 @ 99.12s |
| `compositions/08-caveat.html` | `bg-caveat` | 105.133 | 27.133 | 16 @ 105.13s, 17 @ 108.63s, 18 @ 115.10s, 19 @ 120.08s, 20 @ 127.45s |
| `compositions/09-logo.html` | `logo` | 132.267 | 13.900 | 21 @ 132.27s, 22 @ 138.60s |

Cue points come from `sparktray-campaign/content/voice.json` and are copied, with word timings, into `voice.json` here.

## Shared files

The app window, the walkthrough director and every backdrop kind are written **once**, in `public/video-projects/_templates/js/`, and synced into each template project's `js/` by `node scripts/video/sync-brand.mjs` (it copies `_templates/js/*` into any project whose `meta.json` kind is `"template"`). **Do not edit `js/` here; edit the master and re-sync.**

- `js/tray-kit.js` (shared copy): tokens and brand accents (`brand/tokens.ts`, `brands.ts`), the window shell, sidebar, panes and desktop (`brand/ui/app/shell.tsx`), the step director (`app/director.ts`), SparkTray and BizTray panes and per-tool shots (`app/sparktray*.ts(x)`, `app/biztray*.ts(x)`), the backdrops `contrast`, `caveat`, `mechanism` (rail and store), `steps` and `scene` (`brand/ui/backdrop.tsx`, `backdrops/*`), and the `logo` endcard (`Scene.tsx` `Endcard`, `AppWindow.tsx`). `TrayKit.mount(id, { scene, brand, tool, frames, beats, items })` is the one entry point every composition calls.
- `js/tray-data.js` (shared copy, generated): lucide icon paths (every icon `brand/ui/lucide.ts` exports, from lucide-react 1.24, so backdrop payload tokens resolve the same way `iconFor` does), the SparkTray and BizTray flat tiles and dark lockups (`logo-data.ts`), the Windows 11 wallpaper as a data URI and the taskbar SVG (`brand/ui/windows/*-data.ts`). Everything is inline, so the picture needs no untracked media; only the voice take is in `media.json`.
- `lib/` comes from `_brand` as usual.

## Fidelity

There is no Remotion render of this script in `sparktray-campaign/out/`, so there is no SSIM baseline. The kit it runs on scores 0.987 to 0.995 SSIM against the two BizTray guides' renders (see those projects' notes). The SparkTray-only parts (Transcriber drop and options panes, the purple accent, the SparkTray endcard) were checked by eye against `out/tutorial-transcriber.mp4`, an older render of the same panes: chrome, copy and layout agree.

Rendering notes:
- Each frame rebuilds only what changed: the app window's HTML (compared as a string, so a held pane is not touched), the backdrop's content layer, and the cursor position. Wallpaper, taskbar and tray are built once per shot.
- `frame-kit.css`'s border-box reset is kept on purpose: it matches the Remotion renders to the pixel (content-box made the window 2 px wider and dropped SSIM to about 0.93).
- Fonts: Inter 400 to 800 and JetBrains Mono 400 to 600 from Google Fonts. The Remotion composition only registers Inter; its mono text resolves to a locally installed JetBrains Mono, which is what the reference renders show.
- SVG ids inside the taskbar and the endcard wordmark are namespaced per composition, so the assembled page has no duplicate ids.

## Simplifications and gaps

- Subtitles are not drawn (off by default in the source). The caption band, karaoke timing and `Caption` are not ported.
- Only the pieces these guides need were ported: SparkTray and BizTray apps (all their tools), five backdrop kinds (no `bg-figure`), no standing-by desktop (no `text` beats here), no music bed or sign-off (the script sets neither).
- `hyperframes check` reports contrast warnings on the app's intentionally faint text (sidebar group labels, drop-zone hints, "(3)" counts, the organizer's page numbers). They are the source design's `fgGhost`/`fgDim` tokens and were left as authored.
