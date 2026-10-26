# Massive brand: the visual guide

The one guide for every **new** Massive design: images, videos, GIFs, decks, print, merch, banners. Read it before
designing anything. Where an older file disagrees, this guide wins for new work, and the older file stays as it is
(see [Legacy values](#legacy-values-dont-copy)). Assets (logos, backgrounds, fonts) are listed in
[assets.md](assets.md). Motion and narration for videos are in `public/video-projects/_brand/frame.md`.

## The look

Massive explains infrastructure to builders, so a design reads like a confident technical brief: one strong
statement, type doing the work, one red accent, and a lot of air. Every number comes from a source.

## Registers: pick one per design

| | **Dark** (the default) | **Light** |
|---|---|---|
| Ground | `#0a0a0f`, with the dot grid | `#fff7f2` soft orange, with the line grid. Plain white `#ffffff` is fine too |
| Cards | `#1a1920` (surface `#121117`), border cream at 8% or red at 27% | `#ffffff`, 1px ink border at 14% |
| Text | cream `#faf4ec`; secondary at 75%, dim at 55% | ink `#171615` |
| Accent | red `#d74939`; red-light `#ff8163` for highlights and glows | paper-red `#d54635`; `#f3a07a` for decoration at 25% |
| Logo | white wordmark | ink wordmark (`logo-positive`) |
| Video, GIF | `.m-ground` + `.m-dotgrid` | `.m-ground.soft-orange` (or `.light`) + `.m-linegrid` |
| Image | `#canvas` as is + `.m-dotgrid` | `#canvas.soft-orange` (or `.light`) + `.m-linegrid` |

**No cream grounds in new designs.** The cream paper (`#f1ead8`, `#f5ece0`) reads too close to Claude's palette.
Keep the soft orange as faint as it is; `#ffe9dc` was too much.

## Colour rules

- **One accent, never a second hue.** Red in the dark register, paper-red in the light one.
- **No new gradients.** Only the logo's own gradient, the wordmark fill (`linear-gradient(135deg, red, red-light)`
  clipped to text, for the product-name moment) and the supplied backgrounds (`bg-dark.jpg`).
- **No drop shadows on cards.** The wordmark's soft red glow is the only shadow.
- **The logo gradient is not a token.** Don't recolour the logo to `--red` or redraw it; use the files.

## Type

- **Outfit for everything:** titles, body, eyebrows, labels, counters, badges, URLs.
  - Display and titles: 900, tracking about -0.04em, line height about 1.
  - Subheads: 700. Body: 300 to 400, line height 1.3 to 1.4.
  - Eyebrows and labels: 600, uppercase, tracking 0.08em. An eyebrow is red with a 24×1px red rule before it.
- **JetBrains Mono only for code:** commands, terminal output, file paths, cron lines, API parameters, hashes, set in
  `<code>`, `<pre>`, `<kbd>`, `<samp>` or `.m-code`. Never for decoration. `npm run design:mono -- <page>` checks a
  page; `gif:render` refuses a page that breaks this, and `image:render` warns.
- **Caveat** (handwriting, a local font) is for hand-written notes and annotations, as in the hiring images.
- **Phone legibility** (anything posted to a feed, 1080 px wide): headlines 80 px or more, body 26 px or more,
  labels 18 px or more, and few words.
- **On a 1920×1080 frame:** display 148, h1 96, h2 80, h3 54 (300), lead 36, body 26, eyebrow 14, a big stat 360.

## Layout and texture

- **One statement per design or frame.** Bullets capped at three. Declarative frames stay at least half empty.
- **Safe area:** 100 px sides and 96 px top and bottom on 16:9; 80 px sides at 1080 wide.
- **Texture:** the dot grid on dark (1.5 px dots every 72 px, opacity 0.18), the line grid on light (1 px ink lines
  at 4.5% every 60 px). Always under the content, never over it.
- **Corner brackets** frame content scenes: red, 44 px arms, 3 px thick, 52 px from each corner. Not on logo frames.
- **Cards:** radius 20 px, padding 32 px 40 px.
- **The red brush stroke** (`brush.svg`) sits behind one highlighted word, as in the hiring images.

## Logo

- Dark grounds use a white wordmark, and light grounds use the ink one (`logo-positive`). [assets.md](assets.md)
  lists which file to use in each pipeline.
- About 68 to 72 px tall on a 1920×1080 logo frame; on a post, keep it in the footer and smaller than the headline.
- Branded videos open and close on the logo; the outro pairs it with `joinmassive.com` in Outfit.
- There are two versions of the gradient mark: `#F69666` → `#F16D65` (`logo.svg`, `logo-massive.svg`, `icon-massive.svg`)
  and `#FF9964` → `#FF6E63` (`logo-positive.svg`, `logo-negative.svg`). Both are correct; use the file and don't
  mix them in one design.

## Content on a design

- **Never invent numbers.** Stats, dates, prices and claims come from a source; name that source in the project
  (`meta.json`, a `.source` line, or the brief).
- **Diagrams and real product UI carry the story.** No stock "AI" imagery (robots, glowing brains).

## Sizes by channel

| Channel | Size (px) | Pipeline |
|---|---|---|
| LinkedIn / Instagram feed (portrait) | 1080×1350 | image `--format=portrait`, GIF, video |
| Square post, carousel page | 1080×1080 | image `--format=square` |
| LinkedIn document carousel | 1080×1350 pages, joined as a PDF | images, then one PDF |
| Story, Reel, Short | 1080×1920 | image `--format=vertical`, video |
| X post | 1200×675 | image `--format=x` |
| Landscape, YouTube video | 1920×1080 | image `--format=landscape`, video |
| Open Graph / link preview | 1200×630 | image |
| YouTube thumbnail | 1280×720 | image |
| LinkedIn company cover | 1128×191 | image |
| LinkedIn GIF | see the `massive-gif` skill (size budget) | GIF |
| Print | A4, A5, A3, letter, or mm | print |
| Roll-up banner | 850×2000 mm (856×2006 with bleed) | banners |

## Where the tokens live

Each pipeline has its own copy of the tokens, because each one renders on its own.

| Pipeline | File |
|---|---|
| App UI (dark only) | `src/styles/theme-base.css` |
| Market Map, Top List canvases | `src/styles/theme-canvas.css`, `src/shared/canvas/themes.ts` |
| Images | `public/image-projects/_brand/massive.css` |
| Videos, GIFs | `public/video-projects/_brand/lib/massive.css` and `frame.md` (`npm run video:brand` copies `lib/` and `assets/brand/` into projects) |
| Decks | `scripts/deck/deck.css` |
| Docs | `scripts/docs/massive-doc.css` |

The dark core values (`#0a0a0f`, `#d74939`, `#ff8163`, `#faf4ec`) agree everywhere. If you change one, change it in
every file above.

## Legacy values: don't copy

These exist in older work and stay there. Don't start a new design from them.

| Value | Where | For new work |
|---|---|---|
| Cream ground `#f5ece0` / `#faf4ec`, ink `#1a1b2a`, red `#c9382a` | Docs (`massive-doc.css`), the compliance one-pager, the Jaipur menu, the canvas Light themes | The light register |
| Paper `#f1ead8` (`.m-ground.paper`) | The AEO carousel, `gif-opt-in` | The light register |
| Red-deep `#b8321f` | `--m-red-deep` in the image CSS | `--m-red` / `--m-paper-red` |
| Text at 72% / 48%, page `#050508`, `--green #8be9a1` | `scripts/deck/deck.css` | Cream at 75% / 55%; mark "good" with red-light or a tick, not a second hue |
| Canvas Dark `#0d0c17`, accent `#e05642` | `theme-canvas.css` (the live tools) | The dark core |
| Mono eyebrows, labels and URLs | Older images; videos whose `lib/massive.css` predates the rule; docs, the one-pager, the menu, merch legends, banner URLs | Outfit |

Fifteen older videos carry an old copy of `lib/massive.css` with mono eyebrows. `video:render`, `video:preview` and
`gif:render` copy the current brand files into a project first, so the next render of one of them switches its
eyebrows to Outfit. That's intended, but look at the render before you replace a published file with it.
