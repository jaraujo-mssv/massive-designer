---
name: massive-video
description: Make, edit, port or render a Massive video in this repo's Video tool (HyperFrames projects under public/video-projects). Use when the user asks for a Massive video, explainer, launch teaser, social clip, carousel, voiceover, storyboard or script for the Video tab, or to render one. Covers the script → storyboard → video pipeline, the Massive house style, ElevenLabs narration, and where files go.
---

# Massive video

Videos in this repo are **HyperFrames** projects (HTML + one paused GSAP timeline per
composition), shown read-only in the Video tab (`/video`) and rendered locally. **Never add
Remotion** or any `@remotion/*` package, including HyperFrames' Remotion interop pattern:
Remotion's company license rules it out.

## Where things live

- `public/video-projects/<id>/`: one project per video. Tracked: `index.html`, `compositions/*.html`,
  `STORYBOARD.md`, `SCRIPT.md`, `voice.json`, `frame.md`, `meta.json`, `media.json`, `js/`.
- `public/video-projects/<id>/assets/`: media (voice, music, footage). **Gitignored and not deployed.**
  Only `assets/brand/` (logos) is tracked. The deployed tab previews without media.
- `public/video-projects/_brand/`: master copies of `frame.md` (house style), `lib/` (frame-kit, massive.css)
  and `assets/brand/`. `npm run video:brand` copies `lib/` + `assets/brand/` into every project, because the
  CLI only serves a project's own folder. Edit the master, then sync; never edit a project's `lib/` copy.
- `meta.json`: `{ id, name, group: "massive" | "templates", kind: "native" | "port" | "template", brand, status, source }`.
- `public/video-projects/index.json`: the tab's catalogue. **Regenerate with `npm run video:index` after any change.**

## Commands (Node 22+: run `nvm use` first; the repo's `.nvmrc` pins 24)

| Command | Does |
|---|---|
| `npm run video:new <id> "<Title>" [--format=landscape\|square\|vertical]` | Scaffold a Massive project |
| `npm run video:voice <id> [--dry-run]` | Record SCRIPT.md with ElevenLabs (one take, word timings → `voice.json`) |
| `npm run video:media [id]` | Copy media listed in `media.json` from `../remotion-playground` / `../sparktray-campaign` |
| `npm run video:preview <id>` | HyperFrames Studio for editing + storyboard review |
| `npm run video:index` | Rebuild `index.json` for the tab |
| `npm run video:render <id> [--draft]` | Render to `output/video/<id>.mp4` |

Inside a project folder: `npx hyperframes check` must pass before handing off, and
`npx hyperframes snapshot --at <t1>,<t2>` gives frames to inspect.

## Making a new video: script → storyboard → video

1. **Scaffold**: `npm run video:new <id> "<Title>"`. This copies `frame.md`, the house style that
   HyperFrames' creative skills read first. Treat its frontmatter tokens as brand truth.
2. **Route through `/hyperframes`**, working inside `public/video-projects/<id>`. It runs the intent
   interview, writes `BRIEF.md`, and picks the workflow (`/faceless-explainer` for narrated explainers,
   `/product-launch-video` for joinmassive.com or product pages, `/motion-graphics` for short unnarrated
   hits, `/general-video` otherwise). Follow that workflow's plan → sketch → build review loop.
3. **Storyboard**: `STORYBOARD.md` in HyperFrames format, with one `## Frame N — Title` per
   sub-composition (`scene`, `duration`, `voiceover`, `status`, `src: compositions/…`). This is what
   the tab's Storyboard view shows.
4. **Script**: `SCRIPT.md` in HyperFrames' locked-narration format. Put the spoken text in a 4-space
   indented block under each `## Line N — label (Frame N)`. Massive voice rules: plain, specific
   sentences; **no em-dashes and no hashtags in spoken lines**; ElevenLabs audio tags (`[thoughtful]`,
   `[short pause]`) only in SCRIPT.md; on-screen copy states the claim and narration explains it; never
   invent numbers or scope a claim wider than its source.
5. **Voice**: use `npm run video:voice <id>` (ElevenLabs "Mark", `eleven_v3`, seed 20260806) rather than
   `hyperframes tts`, so every Massive video shares one narrator. It **costs credits**: run
   `--dry-run` first, show the user the character count, and record only after they approve. Then add
   `<audio src="assets/voice/take-….mp3" data-start data-duration data-track-index data-volume>` to
   `index.html`, and time each frame's host clip to the line cues in `voice.json`.
6. **Build**: one sub-composition per storyboard frame (`<template>`-wrapped, root
   `data-composition-id` = host id = `window.__timelines` key). Link `lib/massive.css` and use its
   `m-*` classes and tokens. Asset paths are root-relative even inside `compositions/`
   (`assets/…`, never `../assets/…`). Make ids and SVG def ids unique across the whole page.
7. **Finish**: `npx hyperframes check` passes; snapshots inspected; `npm run video:index`; the user
   reviews it in the tab or Studio. Render only after they approve (`npm run video:render <id>`).

## Porting a Remotion video (from ../remotion-playground)

Use `/remotion-to-hyperframes` with this repo's conventions. Existing ports are the reference:
`launch-teaser`, `why-aeo-is-the-new-seo`, `massive-brand-video`.
- One sub-composition per `<Sequence>`, at `from/fps` seconds.
- Keep the source's per-frame math: `FrameKit.drive(tl, fps, frames, render)` from `lib/frame-kit.js`
  (`interpolate`, closed-form `spring`, `Easing`). This beats approximating springs with `back.out`.
- Write `STORYBOARD.md` from the sequence structure and `TRANSLATION_NOTES.md` covering the SSIM result
  and any gaps. Score against `../remotion-playground/out/<Id>.mp4` after converting the baseline to
  limited range (`-vf scale=in_range=full:out_range=limited,format=yuv420p`), and check the baseline
  isn't older than the source (MassiveBrandVideo's is stale).
- List the source media in `media.json` (`{ "from": "remotion-playground/public/…", "to": "assets/…" }`)
  and run `npm run video:media <id>`.
- Mark intentional design overlap and overflow with `data-layout-allow-overlap` / `data-layout-allow-overflow`.
