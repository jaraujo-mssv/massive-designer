# Plan: Video tool (HyperFrames)

**Status:** Implemented (phases 1–6). Phase 7, porting the remaining 19 playground videos, waits on review of the three proof ports.

### As built (differences from the plan below)
- The Remotion ports keep their per-frame math: `FrameKit.drive()` (`_brand/lib/frame-kit.js`) instead of approximating with GSAP tweens. WhyAEO scores SSIM 0.987 against its Remotion render. MassiveBrandVideo's baseline is older than its source, so it has no meaningful score (see its `TRANSLATION_NOTES.md`).
- BizTray `tutorial-office-to-pdf` had no voice take, so the pptx guide replaced it (`biztray-open-pptx-without-powerpoint`). The two BizTray templates score SSIM 0.992 against their Remotion renders.
- The consent video is filed under Massive / New (`kind: native`).
- Templates share a tray-app kit in `_templates/js/`, which `video:brand` copies into `kind: template` projects.
- The house style is `_brand/frame.md` (the spec name HyperFrames prefers) plus `lib/massive.css`, not `DESIGN.md`.
- Added `video:new` (scaffold) and `video:voice` (ElevenLabs take → `voice.json`, ported from sparktray).
- Only `.claude/skills/massive-video/` is un-ignored; the other local skills stay private.
- Compositions must set `window.__timelines = window.__timelines || {}`, because the embedded player injects the runtime late. FrameKit does this.
- With media missing, the player still loads and seeks; images and audio are just absent.

## Context
Massive's video work lives in two sibling repos:
- **remotion-playground** holds 22 Massive-branded Remotion videos, each hand-built.
- **sparktray-campaign** has a pipeline that goes from markdown scripts to a storyboard to Remotion, with ElevenLabs voiceover.

We want that workflow inside massive-designer as a **Video** tab. Remotion's company license rules it out, so we're moving to **HyperFrames** (heygen-com/hyperframes, Apache 2.0):
- A composition is static HTML plus one paused GSAP timeline.
- Rendering runs locally with headless Chrome and FFmpeg.
- `<hyperframes-player>` is a web component that embeds a composition in any page through an iframe.

HyperFrames already has the pipeline we want:
- `STORYBOARD.md` is a list of frames. Each frame has its own HTML and a voiceover guide.
- `SCRIPT.md` holds the final narration, which is fed to text-to-speech (ElevenLabs is supported).
- Claude Code writes both through the HyperFrames skills (`/hyperframes`, `/hyperframes-core`, `/media-use`, `/remotion-to-hyperframes`).

So we drop sparktray's custom script format and code generator, and adopt HyperFrames' own workflow.

### Decisions (from Q&A)
- **No Remotion code in this repo.** The player, rendering and HyperFrames' Remotion fallback path are all excluded, since that fallback path still uses `@remotion/player`.
- **HyperFrames' own pipeline.** Claude writes the storyboard and script; the tab only displays them.
- **Playground port:** 3 videos first as a quality check (LaunchTeaser, WhyAEOIsTheNewSEO, MassiveBrandVideo). The other 19 follow after you review those 3.
- **Templates rebuilt as HyperFrames projects**, reusing their existing ElevenLabs takes:
  - the consent video
  - the SparkTray guide `guide-transcriber-can-chatgpt-transcribe-audio`
  - the BizTray `tutorial-office-to-pdf`
  - the BizTray `guide-pdf-organizer-how-to-merge-pdf-files`
- **Where projects live:** `public/video-projects/<id>/` (renamed from `public/video/` so it doesn't collide with the `/video` tab route).
  - The HTML is committed and deploys.
  - Each project's `assets/` folder is gitignored and stays out of the Vercel deploy. The only exception is a small `assets/brand/` logo folder.
- **Editing** happens in Claude Code plus HyperFrames Studio (`npx hyperframes preview`). The tab is read-only: Library | Script | Storyboard | Preview.
- **New videos** use the designer's Massive tokens: #0a0a0f / #d74939 / #ff8163 / #faf4ec, Outfit + JetBrains Mono.

### Key facts verified
- `@hyperframes/player` 0.8.77:
  - Its only dependency is `@hyperframes/core`, and it has no Node requirement.
  - `<hyperframes-player src="…/index.html" controls loop muted>` exposes `play`, `pause`, `seek(s)`, `currentTime` and `duration`.
  - It fires `ready`, `timeupdate` and `error` events.
  - Compositions must be same-origin static HTML. If a composition ships no GSAP runtime, the player loads it from a CDN automatically.
- **The `hyperframes` CLI needs Node 22 or newer.** Your machine has Node 20.20, so add `.nvmrc` with `22`. FFmpeg is already installed.
- **`@hyperframes/core/storyboard`** exports the storyboard parser, which never throws. Core pulls in linkedom, postcss and studio-server, so run it only in a Node build script, never in the browser bundle.
- **Porting from Remotion:**
  - Use the `/remotion-to-hyperframes` skill: lint the source, then translate with the API map (`Sequence` → `data-start`/`data-duration`; `interpolate`/`spring` → GSAP tweens; `staticFile("x")` → `assets/x`; `@remotion/google-fonts` → a Google Fonts `<link>`).
  - Then check the result with a visual similarity score (SSIM) against the Remotion MP4s already rendered in `remotion-playground/out/`.
  - Both renders must use the same pixel format, or the score measures encoder differences instead of translation quality.
- **Composition rules to follow:**
  - Each composition registers one paused timeline in `window.__timelines[id]`.
  - The root needs `data-start="0"` and an explicit size.
  - No CSS `transform` on an element whose transform GSAP also tweens.
  - Full-screen background colors go on a child element, not the root.
  - Ids must be unique across the assembled page.
  - No `repeat: -1` and no unseeded randomness.

## Layout
```
.nvmrc                               22
public/video-projects/
  _brand/  DESIGN.md massive.css assets/brand/logo-*.svg|png   (tracked; shared house style)
  index.json                          generated by video:index, committed (tab reads this)
  <id>/                               one HyperFrames project per video
    hyperframes.json index.html compositions/*.html
    STORYBOARD.md  SCRIPT.md (narrated only)  TRANSLATION_NOTES.md (ports only)
    media.json                        committed: [{from: "../remotion-playground/public/music/x.mp3", to: "assets/music/x.mp3"}]
    assets/                           gitignored (except assets/brand/)
scripts/video/ build-index.mjs sync-media.mjs render.mjs
src/tools/video/app/
  App.tsx                             3-pane, URL state ?v=<id>&view=script|storyboard|preview
  components/ Library ScriptPane StoryboardPane FrameTile PreviewPane HfPlayer MediaNotice RenderCommand
  hooks/ useVideoIndex useOnScreen
  types.ts                            JSX IntrinsicElements decl for <hyperframes-player>
src/styles/theme-video.css            + @import in src/styles/index.css
.claude/skills/massive-video/SKILL.md project skill (house rules for new videos)
docs/plans/video.md   docs/video/making-a-video.md
```

## Pieces
- **`build-index.mjs`** (`npm run video:index`) scans every project and writes `public/video-projects/index.json`. For each project it records:
  - `{ id, title, group: 'massive' | 'templates', kind: 'port' | 'native' | 'template', status }`
  - width, height, fps and duration, read from the root `data-*` in `index.html`
  - the parsed storyboard (`@hyperframes/core/storyboard`), with each frame's start time taken from the matching host clip's `data-start` for its `src`
  - the raw `SCRIPT.md`
  - the `assets/…` references found in the HTML (the `media` list)
- **`sync-media.mjs`** (`npm run video:media [id]`) copies the files listed in each project's `media.json` from `../remotion-playground` and `../sparktray-campaign`. The source folders can be overridden with `PLAYGROUND_DIR` and `SPARKTRAY_DIR`. It writes a gitignored `assets/.synced` stamp.
- **`render.mjs`** (`npm run video:render <id…> | --all`) warns when media is missing, then runs `npx hyperframes@0.8.77 render --quality high --output output/video/<id>.mp4` inside the project folder. `--draft` switches to `--quality draft`.
- **`npm run video:preview <id>`** opens HyperFrames Studio on that project for editing and reviewing the storyboard.
- **Dependencies:**
  - `@hyperframes/player` 0.8.77 as a regular dependency.
  - `@hyperframes/core` and `hyperframes` 0.8.77 as exact-pinned dev dependencies.
  - The CLI version is pinned in the npm scripts so renders are reproducible. Check it once with `npx hyperframes@latest upgrade --project . --check`.
- **Config edits:**
  - `.gitignore`: add `public/video-projects/*/assets/*`, `!public/video-projects/*/assets/brand/`, and `.hyperframes/`. Change `.claude` to `.claude/*` plus `!.claude/skills/` so the project skill gets committed.
  - `vercel.json`: exclude `video-projects/` from the SPA rewrite, so a missing asset returns a 404 instead of `index.html`.

## Tab
- **Wiring:**
  - A lazy route `/video` in `src/router/index.tsx`, wrapped in `ToolLayout themeClass="tool-video"`.
  - `{label:'Video', route:'/video'}` in `Header.tsx`.
  - `theme-video.css`.
  - This follows the Bento Map pattern (commit e5ebd4e).
- **Library (left pane):**
  - Groups: Massive (Ports, New) and Templates (SparkTray, BizTray).
  - Each row shows a status pill, size, fps and duration.
  - A lock icon shows when media is missing, checked with a `HEAD` request to `assets/.synced`.
- **Script view:**
  - Shows `SCRIPT.md`: voice, settings, direction, and each line with its delivery note and spoken text.
  - Ported videos without narration show "On-screen copy only".
  - Also shows the project path and a hint: "Edit in Claude Code: `/hyperframes` … · `npm run video:preview <id>`".
- **Storyboard view:**
  - A contact sheet with one tile per frame: title, scene, voiceover, duration, transition and a status chip (outline / built / animated).
  - Each thumbnail is a lazily mounted, muted, paused `<hyperframes-player>` on the project's `index.html`, seeked to the frame's start time plus its poster time. Only tiles on screen mount (`useOnScreen`).
  - Frames still at `status: outline` show a placeholder instead.
- **Preview view:**
  - A full `<hyperframes-player controls>` sized to the project's aspect ratio.
  - When media is missing, a banner reads "Preview without media, which is available locally (`npm run video:media`)". The player still loads.
  - The Phase 2 quality check decides whether that holds up, or whether media-heavy projects should be locked instead.
- **Render command:** every view has a copyable `npm run video:render <id>` with a sonner toast.

## Massive house style for new videos
- `_brand/DESIGN.md` is written in HyperFrames' design-spec format. It covers the palette from `src/styles/theme-base.css`, the type (Outfit and JetBrains Mono via Google Fonts), the logo, motion tone, and default dark and cream themes. The cream theme comes from the AEO videos.
- `_brand/massive.css` holds the shared tokens and classes. Projects link to it with `../_brand/massive.css`.
- `.claude/skills/massive-video/SKILL.md` says:
  - Create videos in `public/video-projects/<id>` through `/hyperframes`.
  - Always follow `_brand/DESIGN.md`.
  - Narration uses ElevenLabs voice "Mark" (`v3p1kjzUvro6S76qmYmH`, `eleven_v3`, stability 0.55), carried over from sparktray's `scripts/lib/voice.mjs`. It needs `ELEVENLABS_API_KEY`.
  - Writing rules from sparktray's `CLAUDE.md` and skills: no em-dashes, spoken lines in plain text, audio tags only in `SCRIPT.md`.
  - Run `npm run video:index` after changes, and render only after approval in Studio.

## Phases (one commit each; land via branch → push → ff-merge master)
1. `docs(plans): add Video tool plan`: `docs/plans/video.md` with Status: Planned.
2. `feat(video): add HyperFrames toolchain and proof ports`:
   - dependencies, `.nvmrc`, `.gitignore` and `vercel.json` changes
   - the `_brand/` folder
   - `build-index.mjs`, `sync-media.mjs`, `render.mjs`
   - ports of **LaunchTeaser**, **WhyAEOIsTheNewSEO** and **MassiveBrandVideo** through `/remotion-to-hyperframes`: lint, translate, add a `STORYBOARD.md` built from the Sequence structure, run the SSIM check against `remotion-playground/out/*.mp4`, and write `TRANSLATION_NOTES.md`
   - **Checkpoint:** show you the 3 rendered ports and their similarity scores before porting anything else.
3. `feat(video): add Video tool with script, storyboard and preview`: the tab, route, nav, theme, and the player type declaration.
4. `feat(video): rebuild consent video as HyperFrames project`:
   - `STORYBOARD.md` and `SCRIPT.md` built from `content/none/scripts/what-does-consent-look-like.md`
   - its existing ElevenLabs take and word timings (from `content/voice.json`) reused as the narration and captions
   - frames rebuilt in HTML/GSAP: the pc-* screens, consent-flow, funding-models, steps preview/recap, consent-settled, and the Massive sign-off
5. `feat(video): rebuild SparkTray and BizTray templates`:
   - the 3 scripts, done the same way as the consent video
   - one shared, parameterised app-window sub-composition covering the open / input / pick / options / queue / run / read / done steps
   - the backdrops (steps, mechanism, contrast, caveat) and the text and logo cards, with brand accents #4F43FF and #EB5943
6. `chore(video): add massive-video skill and docs`: the skill file, `docs/video/making-a-video.md` (walkthrough from brief to rendered MP4), and plan Status set to Implemented.
7. **Follow-up, after your approval at the Phase 2 checkpoint:** port the remaining 19 playground videos in batches:
   - CRM
   - the WebRender set, including its Draft iterations and verticals
   - Demo-Template
   - AEOVisibilityScore ×3
   - WhyAEO Vertical and Chart
   - AIVisibilityCheck
   - the Podcaster, CardCollector and PCRepair use-case videos

## Critical source files
- **playground:** `src/remotion/{Root.tsx, MassiveLaunchTeaser.tsx, WhyAEOIsTheNewSEO.tsx, MassiveBrandVideo.tsx}`, `public/{music,sfx,images,videos,storyboard,brand}`, `out/*.mp4` (SSIM baselines), `src/skills/massive-brand.md`
- **sparktray:**
  - `content/{none,sparktray,biztray}/scripts/*.md`
  - `content/voice.json` (cues and word timings)
  - `public/voice/**/take-*.mp3`, `public/music/calm-lo-fi.mp3`
  - `brand/ui/{app/shell.tsx, backdrops/*, pc/*, ConsentCircuit, FundingModels, ConsentSteps, ConsentSettled, MassiveSignoff}.tsx` (visual reference for the rebuilds)
  - `scripts/lib/voice.mjs`, `CLAUDE.md`, `.claude/skills/*`
- **designer:** `src/router/index.tsx`, `src/shared/components/Header.tsx`, `src/styles/{index,theme-base}.css`, `.gitignore`, `vercel.json`, `package.json`
- **skills:** `~/.claude/skills/{hyperframes, hyperframes-core, remotion-to-hyperframes, media-use, hyperframes-cli}`

## Verification
- **Each project:**
  - `npx hyperframes check` passes with 0 findings.
  - `npx hyperframes snapshot --at <frame midpoints>` looks right on inspection.
  - Studio preview plays with media synced.
- **Ports:** the SSIM score clears the tier threshold from `remotion-to-hyperframes/references/eval.md`. Where a video fails, `frame_strip.sh` shows which frames diverge.
- **Tab, local** (`npm run video:media && npm run dev` → `/video`):
  - every project plays;
  - storyboard tiles match the frames seen in Studio;
  - the script pane shows `SCRIPT.md`;
  - the render command copies.
- **Deployed site:** a Vercel preview loads the tab with no assets. The players still load, and the "media available locally" banner shows. `/video-projects/<id>/assets/*` returns 404, not `index.html`.
- **Render:** `nvm use && npm run video:render launch-teaser` writes `output/video/launch-teaser.mp4`. Project ids are kebab-case versions of the playground ids.
- **Build:** you run `npm run build` yourself. Per your preference, no tsc or build after every edit.
