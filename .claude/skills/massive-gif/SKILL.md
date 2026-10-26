---
name: massive-gif
description: Make, edit or render a Massive looping GIF for LinkedIn in this repo's Video tool (HyperFrames projects with "output": "gif" under public/video-projects). Use when the user asks for a GIF, animated GIF, looping post graphic, LinkedIn GIF, or a static design with a few moving parts, or to render or shrink one. Covers the project format, the seamless-loop technique, LinkedIn's limits and the size budget, the Massive house style, and where files go.
---

# Massive GIF

A GIF here is **one static design with a few moving parts**, no scenes: a HyperFrames project whose whole animation
is a pure function of the loop phase. `npm run gif:render` captures it with HyperFrames, encodes it with FFmpeg to
LinkedIn's limits, and checks it. The Video tab (`/video`, dev server only) shows GIFs in their own section. For
anything longer than about 10 seconds, or with sound, make an MP4 with the `massive-video` skill instead.

## Where things live

- `public/video-projects/<id>/`: one project per GIF, with `meta.json` `"output": "gif"`. Tracked: `index.html`,
  `meta.json`, `frame.md`, `hyperframes.json`, `media.json`, `js/` (data and helper scripts), `assets/brand/` (logos)
  and `gif/` (the render). The rest of `assets/` is gitignored, so don't put GIF files there.
- `public/video-projects/<id>/gif/`: written by `gif:render` and committed: `<id>.gif`, `first-frame.jpg` (page 0 of
  the GIF, the still LinkedIn shows) and `stats.json` (size, frames, palette, LinkedIn checks). Frames and failed
  encodes stay in `output/gif/`.
- `public/video-projects/_gif/`: `lib/loop-kit.js` (master copy; `video:brand` and `gif:render` copy it into GIF
  projects' `lib/`) and `template.html` (the scaffold). `_brand/` (massive.css, frame-kit.css, frame.md, logos) is
  shared with the videos.
- `scripts/video/gif.mjs` (the pipeline) and `scripts/video/lib/gif-spec.mjs` (formats, limits, colour ladder,
  checks: change limits there only).

## Commands (Node 22+: run `nvm use` first)

| Command | Does |
|---|---|
| `npm run gif:new <id> "<Title>" -- --format=portrait\|square\|wide` | Scaffold: 1080×1350 (default), 1080×1080 or 1200×628 |
| `npm run gif:render <id…>` / `npm run gif:render -- --all` | Capture, encode under 5 MB, check, publish to `<id>/gif/`, rebuild the index |
| `npm run gif:render -- <id> --colors=128 --fps=12` | Pin the palette size or frame rate instead of the defaults |
| `npm run video:preview <id>` | HyperFrames Studio |
| `npm run video:index` | Rebuild the tab's `index.json` (`gif:render` does it for you) |

Inside the project folder, `npx hyperframes check` (lint, runtime, layout, contrast) must pass before rendering.

## Project format

- **The root**: `<div id="stage" data-composition-id="<id>" data-start="0" data-duration="5" data-fps="15"
  data-width data-height>`. Duration × fps must be a whole number and at most 250.
- **Paint the ground on a child**: `<div class="m-ground">`, or `m-ground paper`. When HyperFrames captures frames for a
  GIF it forces `html`, `body` and the root transparent, so a background there vanishes, and the render stops if
  frame 1 isn't opaque. Set the text colour and font on `#stage`, because the ground is a sibling, not a parent.
- **One script at the end**: build once, define `render(p)`, then register the timeline inline. Lint looks for this
  line in the HTML, so a helper can't do it:
  ```js
  const tl = gsap.timeline({ paused: true });
  LoopKit.drive(tl, document.getElementById("stage"), render);
  window.__timelines["<id>"] = tl;
  ```
- The design is always on: no `class="clip"` and no `data-start` on design elements.
- **Never write `</script>` in a local JS file, even in a comment.** HyperFrames inlines local scripts into the page,
  and the tag ends the script early (the copy of `world-paths.js` in `gif-195-countries` had to be edited for this).
- `meta.json`: `alt` is the LinkedIn alt text (what moves, and the headline); `source` names where the copy comes
  from. GIFs never set `posterFromEnd`: it would put a jump into the loop.

## The loop

- `render(p, t)` draws the whole frame from the phase `p` (0 → 1) and the time `t` in seconds. Every periodic motion
  completes a whole number of cycles per loop (`wave(p, 3)`, `frac(p * n + i / n)`). Frame i is captured at
  t = i / fps, so t = duration never appears and the last frame flows into the first.
- **Phase 0 is the still.** Previews, failed uploads and profile slots show only the first frame, so at `p = 0` the
  design is complete and carries the message. Start on the payoff, move, come back; never start empty or mid-wipe.
- `LoopKit` (in `lib/loop-kit.js`):
  - `seq(p, [[0, a], [0.3, a], [0.42, b], [0.72, b], [0.86, a], [1, a]])`: hold, move, hold. Start and end on the
    same value.
  - `env(since(p, at, count))`: `count` evenly spaced pulses with a quick rise and slow fall.
  - `step(p, n)`: `{ i, u }` for discrete events such as a log line or a ticker.
  - Also `wave`, `edgeFade`, `ease`, `lerp`, `clamp`, `frac`, and `rng(seed)` for seeded randomness.
- **Deterministic only**: no `Math.random`, no `Date`, no CSS animations or transitions, no `requestAnimationFrame`.
- **Don't measure in `render`.** Measure once while building, or better, place moving parts in a fixed box so
  nothing is measured: the script runs before the web fonts load and the layout settles.
- At 15 fps a repeating pattern that moves more than about a quarter of its period per frame strobes; keep dashes
  and stripes slow. No more than 3 flashes a second. Hold changing text about 1 second per 3–4 words.

## LinkedIn spec (the strictest published limits)

| Setting | Target |
|---|---|
| File size | Under 5 MB (`gif.mjs` counts 5,000,000 bytes) |
| Frames | 250 or fewer |
| Size | 1080×1350 (4:5) or 1080×1080 (1:1) for most posts; 1200×628 (1.91:1) for landscape |
| Length | 3–6 s, seamless loop (the scaffold uses 5 s) |
| Frame rate | 15 fps (10–24) |
| First frame | Works on its own as a static image |

- GIFs animate in feed posts, articles, comments, DMs and single image ads. They never animate in carousel ads, or as
  a profile photo, banner or company cover.
- Post through the photo button (not the video button), one GIF per post, with the alt text.
- A GIF helps when it carries information the text can't: a process, a before/after, a product demo, a data change.
- Before posting, check the GIF:
  - It is under 5 MB, 250 frames or fewer, and in one of the three shapes.
  - It loops cleanly and its first frame works as a still.
  - Its text is readable on a phone.
  - The alt text is written.
  - The caption ends with a real question.
  - The preview animates before you hit Post.

## Size budget

- **Size comes from the pixels that change between frames, not from the colour count.** Measured at 4:5, 15 fps, 5 s:

  | What moves | Size |
  |---|---|
  | A still with small moving parts | about 0.3 MB |
  | An 800×190 block moving for 2 s | 1.3 MB |
  | The whole canvas "breathing" | 2.9 MB |
  | A 1200×628 log scrolling continuously | 5.2 MB, which fails |
  | The same log stepping 8 times a loop | 2.2 MB |

  The four demos come out at 0.15–0.9 MB.
- **Rules:**
  - Keep moving regions small.
  - Step instead of scrolling.
  - Use flat fills on anything that moves: no glows, gradients or blur.
  - Static gradients and textures are fine, because they are encoded once.
  - No grain or noise, and no full-canvas fades.
- The encoder steps down 256 → 128 → 64 colours (sierra dither), then 64 with bayer, which saves only about 20%. If
  nothing fits, `gif.mjs` names the heaviest seconds and publishes nothing.

## House style

Follow `brand/BRAND.md` (registers, colours, type, sizes), with the video layer in `_brand/frame.md` and the classes
in `lib/massive.css`. In a GIF:
- **Dark register**: `.m-ground` + `.m-dotgrid`, cream type, one red accent.
- **Light register**: `.m-ground.soft-orange` (`#fff7f2`, a faint tint of the logo orange) with `.m-linegrid`, white
  cards with an ink border, ink type, accents in `--m-paper-red`. Keep the tint that subtle; `#ffe9dc` was too much.
  Plain white is `.m-ground.light`. **Use these instead of the cream `.m-ground.paper`**: cream reads too close to
  Claude's palette.
  (`gif-opt-in` predates this and is still cream.)
- **Type**: Outfit for all type, labels, counters and URLs included. **JetBrains Mono only for code** (commands,
  paths, cron lines, parameters) in `<code>`, `<pre>` or `.m-code` (CLAUDE.md rule 4). `gif:render` refuses a page
  that uses mono anywhere else, and so would `npm run design:mono -- video-projects/<id>`.
- **Phone sizes**: at 1080 wide, headlines at 80 px or more, body at 26 px or more, labels at 18 px or more, and few
  words.
- **Footer**: the logo (`assets/brand/logo-white.svg`, or `logo-positive.svg` on light grounds). The machine series
  closes on the logo alone, centred, without the URL.
- **Copy**: never invent numbers. Take copy from a source file and name that file in `meta.json`.

## Machine kit (infographic workflows)

For a workflow drawn as a machine (stations joined by pipes, an archive that fills), opt in with `meta.json`
`"kits": ["machine"]`. The sync then copies `_gif/kits/machine/{machine-kit.js, machine.css}` into `lib/`.
- **Page:** each `index.html` is a config passed to `MachineKit.build(stage, {...})`. The header comment of
  `machine-kit.js` documents it, and `gif-archive-01-terms` is the reference.
- **Layout:**
  - A centred title and one-line why.
  - Up to six station cards, then the archive cabinet.
  - The **stack** card goes in the footer and closes the frame. It names the parts and who does what (Partner ·
    Massive · "Your agent"). It has no fill, a dashed outline and app icons; there's no separate Massive logo.
  - No series counter, no partner lockup in a header.
- **Rooms:**
  - `proxy`: the network is a side loop off the browser engine, for a browser whose requests go out through Massive.
  - `api`: Massive answers first (Web Search, `/ai`), then the browser opens the results.
- **Motion:** the stations run in parallel, with every pipe carrying its own packet and two or three in flight at
  once. That keeps the loop to 3 s (`data-duration="3"`, 45 frames, about 0.6 MB).
  - Archive cards carry relative labels (`today`, `−1 d`), so the stack steps back one slot and still meets frame 0.
- **Text that changes:** `{cc}`-style placeholders step through `ticker`. Code values go in `<code>`; countries go in
  `<b>`.
- **Cards:**
  - No eyebrows: each title carries its step number ("01 Schedule").
  - `terminal` holds a command.
  - `panel` holds settings or API parameters as key/value rows, for partners you set up in a UI or a request.
  - Stack items take `{ icon, name, role }`, or `{ logo, role }` for a wordmark that already spells the name.
  - The `shot` archive card is only for partners that really return screenshots (MrScraper, CaptureKit, Scrappey,
    Metal). Neither Lightpanda nor Massive's Web Render returns images.
- **Partners:** one per GIF, from the Web Data Marketplace. Show Massive only where the partner's docs give a way in:
  - a bring-your-own-proxy field;
  - Massive's own guide or a published integration (Omnifox, Notte).
  
  **Icons:**
  - Take each icon from the partner's favicon via Google's favicon service
    (`t1.gstatic.com/faviconV2?…&url=https://<domain>&size=256`, or `google.com/s2/favicons?domain=<domain>&sz=256`).
  - Turn it into an app icon: a 128 px tile with 28 px corners. Full-bleed favicons keep their colour; transparent
    ones sit at 74% on white.
  - Save it as `assets/brand/partner-app.png`. Massive's is `massive-app.png`.
  - If Google only has a 32 px favicon, use the same icon art at a higher resolution (the partner's touch icon or
    Massive's marketplace listing).
  - Get the partner's sign-off before posting.

## Scenes kit (a series where every GIF looks different)

**Keep the frame, vary the body.** A series shares the frame: the ground, a centred title and why line at the top, and the
dashed stack card in the footer. Each GIF's body is its own scene, with a layout and motion that show what that partner actually
does. The machine kit made twelve partner GIFs look interchangeable; don't repeat that.
- **Opt in:** `meta.json` `"kits": ["scenes"]` copies `_gif/kits/scenes/{scenes.js, scenes.css}` into `lib/`.
- **What the kit provides:**
  - `Scenes.frame(stage, { title, why, stack })` draws the frame.
  - `Scenes.browser`, `Scenes.card`, `Scenes.code`, `Scenes.svg`, `Scenes.el` and `Scenes.div` are building blocks.
  - Lay the body out between y 412 and about 1180; `scenes.css` lifts it 64 px so it sits above the footer stack card.
    Everything else (layout, `render(p)`) lives in the project's
    `index.html`.
- **Motion:** 4 s at 15 fps (60 frames), usually 0.15–0.3 MB. Frame 0 is the finished state. The loop:
  1. resets quickly;
  2. replays the story (scan, strike, walk, capture);
  3. ends where it started.
- **References:**
  - `gif-archive-diffbot`: an article redline.
  - `gif-archive-epctex`: a grid scan with a reticle.
  - `gif-archive-notte`: a tree walk onto a pile.
- **Stacks:** in a pile of cards, show text only on the top card, since covered text fails the layout check.

Demos to copy from:

| id | Shape | Shows |
|---|---|---|
| `gif-195-countries` | 4:5 dark | Canvas dot map drawn once; packets ride arcs to countries; ticker steps |
| `gif-mcp-stack` | 1:1 dark | Before/after: one install card opens into five chips and closes |
| `gif-mcp-live-log` | 1.91:1 dark | Terminal log that steps one row at a time, never scrolls |
| `gif-opt-in` | 4:5 cream (old register) | Settings switch, cursor and click ring in the switch's own box, dots flow while on |
| `gif-archive-01-terms` | 4:5 light | Machine kit: Lightpanda through a Massive side loop, word diff, archive of daily copies |
| `gif-archive-05-pricing` | 4:5 light | Machine kit with a ticker: country and locale step through the command and the network |
| `gif-archive-<partner>` (12) | 4:5 light | Scenes kit, one marketplace partner each, each a different scene: Sequentum, MrScraper, CaptureKit, Diffbot, Scrappey, JigsawStack, Parsera, epctex, rtrvr.ai, Omnifox, Notte, Metal |

## Workflow

1. Write the post first. Make a GIF only if motion makes the point clearer, and give it one job.
2. Scaffold with `npm run gif:new`, then design phase 0 as a finished still before adding one to three moving parts.
3. `npx hyperframes check` in the folder. Mark intentional layering with `data-layout-allow-overlap` /
   `data-layout-allow-overflow`; hide elements that are wholly outside a clip.
4. `npm run gif:render <id>`. Then check the output:
   - Look at `gif/first-frame.jpg`.
   - Look at a strip of frames: `ffmpeg -i gif/<id>.gif -vf "select='eq(n\,0)+eq(n\,37)+eq(n\,74)',tile=3x1"
     -frames:v 1 strip.png`.
   - Confirm every check in `gif/stats.json` is ok. "Loop seam" fails when the last frame doesn't flow into the
     first.
5. Review it at `/video?v=<id>`: the live HTML plays next to the GIF. Then commit the project with its `gif/`.
