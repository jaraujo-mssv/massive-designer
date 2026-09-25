# Making a video

The Video tab (`/video`) is where Massive's videos live. Each video is a
[HyperFrames](https://github.com/heygen-com/hyperframes) project: HTML compositions animated
by a paused GSAP timeline, rendered to MP4 on your machine. The tab shows each project's
script, storyboard and a live preview. It doesn't edit anything: you do that with Claude
Code or HyperFrames Studio.

## One-time setup

- Node 22 or newer: run `nvm use` in the repo (`.nvmrc` pins 24).
- FFmpeg on your PATH (`brew install ffmpeg`).
- `npx hyperframes browser ensure` installs the headless Chrome the renderer uses.
- To pull media for the existing videos, check out `remotion-playground` and
  `sparktray-campaign` next to this repo, then run `npm run video:media`. Voiceover, music and
  footage are gitignored, so they never reach the deployed site.
- To record narration, set `ELEVENLABS_API_KEY`.

## From idea to MP4

1. **Ask Claude Code** for the video, e.g. "make a 45-second explainer about Web Render's
   `/search` endpoint for the Video tab." The `massive-video` skill scaffolds the project,
   applies the Massive house style (`public/video-projects/_brand/frame.md`), and runs
   HyperFrames' own workflow: brief → storyboard → script → build.
2. **Review the storyboard.** `STORYBOARD.md` has one frame per scene. It appears in the tab
   under **Storyboard** once `npm run video:index` has run, and in Studio via
   `npm run video:preview <id>`.
3. **Lock the script.** `SCRIPT.md` is the narration. `npm run video:voice <id> --dry-run`
   shows the character count, and `npm run video:voice <id>` records a single ElevenLabs take
   with word timings. That call costs credits.
4. **Build and check.** Claude builds each frame and runs `npx hyperframes check`. You watch
   it under **Preview** in the tab.
5. **Render.** `npm run video:render <id>` writes `output/video/<id>.mp4`. Add `--draft` for
   a fast pass.

## Folder layout

```
public/video-projects/
  _brand/          house style: frame.md, lib/ (frame-kit, massive.css), assets/brand/ (logos)
  index.json       catalogue the tab reads (npm run video:index)
  <id>/
    index.html     host composition
    compositions/  one sub-composition per storyboard frame
    STORYBOARD.md  frames
    SCRIPT.md      narration (narrated videos only)
    voice.json     line cues and word timings from the voice take
    meta.json      title, group, kind, status, source
    media.json     where untracked media comes from
    assets/        media (gitignored except assets/brand/)
```

## What's in the library

- **Massive / Ported from Remotion:** videos from `remotion-playground`, translated
  frame-for-frame. Each has a `TRANSLATION_NOTES.md` with its fidelity score.
- **Massive / New:** videos built natively in HyperFrames.
- **Templates:** rebuilt SparkTray and BizTray guides that show the narrated
  app-walkthrough pattern.

## Why not Remotion

Remotion requires a paid company license for teams bigger than three people. HyperFrames
is Apache 2.0, so nothing in this repo may depend on `remotion` or `@remotion/*`.
