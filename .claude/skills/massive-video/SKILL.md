---
name: massive-video
description: Make, edit, port or render a Massive video in this repo's Video tool (HyperFrames projects under public/video-projects). Use when the user asks for a Massive video, explainer, launch teaser, social clip, narrated animation, voiceover, storyboard or script for the Video tab, or to render one. Looping GIFs are massive-gif; LinkedIn document carousels are stills (massive-image). Covers the script → storyboard → video pipeline, the Massive house style, ElevenLabs narration, and where files go.
---

# Massive video

Videos in this repo are **HyperFrames** projects (HTML + one paused GSAP timeline per
composition), shown read-only in the Video tab (`/video`) and rendered locally. **Never add
Remotion** or any `@remotion/*` package, including HyperFrames' Remotion interop pattern:
Remotion's company license rules it out. Looping LinkedIn GIFs (one design, a few moving parts) are HyperFrames
projects too, with their own pipeline: use the `massive-gif` skill.

## Where things live

- **The brand:** `brand/BRAND.md` (registers, colours, type, the mono rule, sizes) and `brand/assets.md` (which logo
  where). The video layer on top of it (type scale, motion, narration) is `public/video-projects/_brand/frame.md`.
- `public/video-projects/<id>/`: one project per video. Tracked: `index.html`, `compositions/*.html`,
  `STORYBOARD.md`, `SCRIPT.md`, `voice.json`, `frame.md`, `meta.json`, `media.json`, `js/`.
- `public/video-projects/<id>/assets/`: media (voice, music, footage). **Gitignored and not deployed.**
  Only `assets/brand/` (logos) is tracked. The Video tab is dev-server only: the deployed build leaves out the tab
  and all of `public/video-projects/`.
- `public/video-projects/_brand/`: master copies of `frame.md` (house style), `lib/` (frame-kit, massive.css)
  and `assets/brand/`. `npm run video:brand <id>` copies `lib/` + `assets/brand/` into a project, because the
  CLI only serves a project's own folder. Edit the master, then sync the project you're working on; never edit a
  project's `lib/` copy. Without an id it syncs every project, and 15 older ones would switch their mono eyebrows to
  Outfit, so don't run it bare.
- `meta.json`: `{ id, name, group: "massive" | "templates", kind: "native" | "port" | "template", brand, status, source }`.
  **Every video sets `"posterFromEnd": true`**: the render copies the last frame over frame 0, so the file's
  thumbnail (LinkedIn, Slack) shows the finished end screen. `video:new` writes it; add it to any project that lacks it
  before rendering. GIF projects (`"output": "gif"`) are the exception: a seamless loop has no end screen, so their
  phase 0 is designed as the still instead (see `massive-gif`).
- `public/video-projects/index.json`: the tab's catalogue. **Regenerate with `npm run video:index` after any change.**

## Commands (Node 22+: run `nvm use` first; the repo's `.nvmrc` pins 24)

| Command | Does |
|---|---|
| `npm run video:new <id> "<Title>" [--format=landscape\|square\|portrait\|vertical]` | Scaffold a Massive project |
| `npm run video:voice <id> [--dry-run]` | Record SCRIPT.md with ElevenLabs (one take, word timings → `voice.json`) |
| `npm run video:media [id]` | Get the media listed in `media.json`: download each `url`, or copy `from` a sibling repo |
| `npm run video:media -- --push <id>` | Upload a project's untracked media (voice takes, footage) and record the URLs in `media.json`. Needs `BLOB_READ_WRITE_TOKEN`; the URLs are public |
| `npm run video:preview <id>` | HyperFrames Studio for editing + storyboard review |
| `npm run video:index` | Rebuild `index.json` for the tab |
| `npm run video:render <id> [--draft]` | Render to `output/video/<id>.mp4` |
| `npm run video:sfx <id> [sheet]` | Mix a template's `assets/template/*.cues.json` into its one-file sound bed |

Inside a project folder: `npx hyperframes check` must pass before handing off, and
`npx hyperframes snapshot --at <t1>,<t2>` gives frames to inspect.

## Making a new video: script → storyboard → video

1. **Scaffold**: `npm run video:new <id> "<Title>"`. This copies `frame.md`, the house style that
   HyperFrames' creative skills read first. Treat its frontmatter tokens as brand truth.
2. **Route through `/hyperframes`**, working inside `public/video-projects/<id>`. It runs the intent
   interview, writes `BRIEF.md`, and picks the workflow (a narrated explainer, a product launch from
   joinmassive.com or a product page, a short unnarrated motion graphic, or a general video), installing
   that workflow's skill if it's missing. Follow that workflow's plan → sketch → build review loop.
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
   **Audio clips must not end inside their `data-duration` window.** In Firefox the runtime reads an
   ended clip as buffering and freezes the preview clock. Keep each window within its file's length. For
   short SFX, pre-mix them into one bed that spans the whole video (see the welcome template).
6. **Build**: one sub-composition per storyboard frame (`<template>`-wrapped, root
   `data-composition-id` = host id = `window.__timelines` key). Link `lib/massive.css` and use its
   `m-*` classes and tokens. **JetBrains Mono only for code** (commands, terminal output, paths), in `<code>`,
   `<pre>` or `.m-code`; eyebrows, labels and URLs are Outfit (CLAUDE.md rule 4). Older videos use mono labels;
   don't copy that. Check a page with `npm run design:mono -- video-projects/<id>`. Asset paths are root-relative even inside `compositions/`
   (`assets/…`, never `../assets/…`). Make ids and SVG def ids unique across the whole page.
7. **Finish**: `npx hyperframes check` passes; snapshots inspected; `npm run video:index`; the user
   reviews it in the tab or Studio. Render only after they approve (`npm run video:render <id>`).

## Welcome video for a new hire (`welcome-to-massive` template)

This is a 15.5 s video. A Slack icon bounces in the dock, becomes the notification "<name> has joined Massive!",
then opens a profile card styled like a character sheet. Every per-person value is a composition variable
declared on `<html>` in `public/video-projects/welcome-to-massive/index.html`:

| variable | example | notes |
|---|---|---|
| `firstName` | Franklin | Used in the notification and the outro |
| `fullName` | Franklin Uche | Long names shrink, then wrap to two lines |
| `location` | Lagos, Nigeria | City, Country |
| `role` | Community Lead | Shown as the "ROLE" tag |
| `hobbies` | `Playing football\nPlaying golf\nGardening` | One per line (commas also work), max 5 chips |
| `food` | Medium rare steak and rice | "Fuel" |
| `photo` | `assets/template/franklin.jpg` | Path inside the project, or a URL. Square, ideally 720 px or more (shown at 356 px) |
| `sfx` | `assets/template/sfx-mix-3.mp3` | Sound bed with one ping per hobby chip: `sfx-mix-N.mp3`, N = number of hobbies (1–5) |

The committed defaults are Franklin Uche's, so they're in git (the deployed site doesn't serve video projects). Anyone else's details and
photo stay local unless the user says otherwise.

To render someone else, map the onboarding-form answers (name & last name, location, role, hobbies, favourite
food) to the variables. The form's "something you are a huge fan of" isn't used. Skip the form's unlabeled "?" column. Write them to a
local JSON file outside the repo (or under `output/hires/`, which is gitignored), with `sfx` set to match their
hobby count. Put their photo in the project's `assets/hires/`, which is gitignored (`assets/template/` gets committed).
Crop non-square photos to a square around the face first.
Then run:

```bash
npm run video:render -- welcome-to-massive --variables-file output/hires/<first>.json --name welcome-<first>
```

This writes `output/video/welcome-<first>.mp4`. Its first frame is a copy of the last one (`"posterFromEnd": true` in
`meta.json`), so the file's thumbnail shows the finished card. In Studio (`npm run video:preview welcome-to-massive`) the
same variables are editable in the variables panel. Sounds are the bundled Pixabay SFX plus Slack's knock in
`assets/template/sfx/`, pre-mixed into `assets/template/sfx-mix-1…5.mp3` (16 s beds that differ only in the number
of chip pings; cue times in the comment above the `<audio>` tag); no music or voice. To move a cue, re-mix all five
beds with ffmpeg rather than adding clips.

## Birthday, work anniversary and holiday templates

Three more templates in the welcome video's series. Each is its own project, copied from `welcome-to-massive`: the
same desktop, dock bounce and Slack notification, with a different card and outro. They keep the welcome video's timing
(notification 2.3 s, card 4.4 s, outro 11 s, 15.5 s total), `posterFromEnd` and the Franklin defaults. Each has **one
fixed sound bed**, `assets/template/sfx-<name>.mp3`, mixed from the bundled SFX with `npm run video:sfx <id>` using the
cue sheet next to it (`sfx-<name>.cues.json`). The number of sound cues never depends on a variable, so there's no
`sfx` variable. Render them like the welcome video, e.g.
`npm run video:render -- birthday --variables-file output/hires/<first>.json --name birthday-<first>`.

**`birthday`**: "It's <name>'s birthday!", then a BIRTHDAY XP bar fills and **LEVEL UP!** slams in with seeded confetti,
followed by fixed reward chips. Variables: `firstName`, `fullName`, `role`, `location`, `photo` (as in the welcome video).
**Never add an age**: no level number, no birth year or date variable, no countable candles. "LEVEL UP!" stands alone.

**`work-anniversary`**: "<name> is celebrating N years at Massive!" ("1 year" is singular), then a count-up, one numbered
pip per year and an "Achievement unlocked" toast. Variables: `firstName`, `fullName`, `role`, `photo`, and `years`
(number, 1–20). The row shows up to 10 pips, plus a dashed pip for next year; above 10 the last pip reads "10+". The pips
share one 1.2 s window, so the bed fits any value.

**`holiday-greetings`**: a company-wide greeting with no person variables. `holiday` is an `enum`: `hanukkah` (default)
or `rosh-hashanah`. It switches the notification, card copy, motif and outro. The copy is transliterated only, with no
Hebrew script, because Outfit has no Hebrew glyphs. Hanukkah shows a hanukkiah where the shamash lights and then eight
candles light left to right. Rosh Hashanah shows an apple, a honey dipper that drips twice and eight pomegranate seeds.
Both motifs put their eight beats on the same cues (6.4 + i·0.3 s), so one bed serves both. To add a holiday:
1. Add an enum option.
2. Add `.only-<x>` copy spans in all three compositions.
3. Add CSS to hide them for the other holidays.
4. Add an SVG motif on the same eight beats.

Each composition's script sets `data-holiday` on its host clip and on the inlined `#root` (`setHoliday`). The CSS keys
off `[data-holiday="…"]`.

To preview a non-default value with `npx hyperframes snapshot`, which takes no variables, copy the project to a
scratch folder and change the variable's `default` there.

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
