# CLAUDE.md

Massive Designer (`designer-hub` in package.json) is a set of internal tools that turn spreadsheets and HTML pages
into on-brand images for Massive. It is one React 18 + TypeScript SPA built with Vite 6, Tailwind CSS v4 and
shadcn/Radix UI, deployed to Vercel. Each tool is one route.

## Rules

1. **Verify every visual change with a screenshot before you finish.** Anything that can change pixels counts: UI,
   canvas layout, themes, CSS, fonts, logos, export, image or deck HTML. Look at the screenshot yourself and say in
   your report what you checked. If you couldn't take one, say so; don't report the change as done.
   - App UI or canvas tools: `npm run dev`, open the route, screenshot it. For Market Map and Top List, load one of
     the Examples from the sidebar and check every theme and size the change touches (at least Light and Dark). If
     the change touches export, also download the JPG and look at that, because the export is a separate render.
   - Phone layout: if you changed the page layout, also check at 375 px wide.
   - Image projects: `npm run image:render <id>` and open `output/images/<id>.jpg`.
   - Decks: `npm run deck <slug> -- --png` and open `output/deck/<slug>/NN.png`.
2. **Don't break the build.** `npm run build` must pass before you finish (it takes a few seconds).
   - `vite build` does not type-check. `npx tsc --noEmit` already fails on `master` (26 errors when this was
     written, 21 of them in the legacy apps). Don't add new ones: run it before and after and compare.
   - If you touch `localOnlyRoutes()` in `src/router/index.tsx` or `localOnlyPublicDirs()` in `vite.config.ts`,
     check that `dist/` still has no `video-projects/`, `content/` or `storyboards/`.
3. **Keep changes small.** One concern per change and per PR. No drive-by refactors, renames, reformatting or
   dependency bumps. There's no linter or formatter here, so match the file you're in (quotes, comment density,
   naming). Leave alone unless asked: the legacy apps (`src/tools/*-legacy/`), the deprecated tools (Social Media,
   Campaign Designer, Dither) and `originals/`.
4. **Mono only for code, in every design** (images, videos, GIFs, decks, docs, merch, banners). JetBrains Mono is
   for commands, file paths, cron lines, API parameters and other code, set in `<code>`, `<pre>` or `.m-code`.
   Eyebrows, labels, counters, badges and URLs are Outfit, never mono for decoration. `npm run design:mono --
   <page...>` checks pages under `public/`. `gif:render` refuses a GIF that breaks the rule, and `image:render` warns.

## Install, run, build

```bash
npm install          # Node 24 (.nvmrc). A SessionStart hook in .claude/settings.json runs this for you.
npm run doctor       # what this machine is missing (FFmpeg, Chromium, HyperFrames, keys), in plain language
npm run setup        # the same check, then installs what it can
npm run dev          # http://localhost:5173
npm run build        # vite build → dist/
npm run preview      # serves dist/, with the image proxy
```

- No env vars are needed for the app. `.env` (see `.env.example`) only holds `ELEVENLABS_API_KEY`,
  `ELEVENLABS_IMAGE_API_KEY` and `GOOGLE_AI_API_KEY`, for `npm run content:photos`, `npm run video:voice` and
  `npm run merch:mockups`.
- `npm run merch:mockups` makes the Merch tab's desk photos (`public/merch-files/mockups/`) through ElevenLabs (GPT Image 2)
  from the rendered designs, with `ELEVENLABS_IMAGE_API_KEY` (the general key lacks the `image_video_generation`
  permission). It costs plan credits, so `merch` doesn't run it.
- Deploy is Vercel. `vercel.json` rewrites everything except `/api/` and `/video-projects/` to `index.html`, and
  `api/image-proxy.ts` is the serverless image proxy.
- **Dev server only:** Video and Content work on local files. In a build `import.meta.env.DEV` is false, so their
  routes, nav entries and code drop out, and `localOnlyPublicDirs()` deletes their `public/` folders from `dist/`.
- Script commands that render through Playwright Chromium: `image:render`, `deck`, `deck:pptx`, `docs`, `onepager`,
  `menu`, `banners`, `merch`. If Chromium is missing, `npm run setup` installs it. Renders go to `output/`
  (gitignored), except `merch`, which writes to `public/merch-files/` (committed: the live Merch tab serves them), and
  `gif:render` (HyperFrames + FFmpeg), which writes each GIF to `public/video-projects/<id>/gif/` (committed).
- **npm flags go after `--`:** `npm run image:render -- --all`. Before `--`, npm takes the flag for itself.

## Structure

| Path | What |
|---|---|
| `src/main.tsx`, `src/router/index.tsx` | Entry and routes. `ToolLayout` wraps each tool in the header and a `tool-<name>` class. |
| `src/shared/components/Header.tsx` | The nav: the `tools` list, with `localOnly` and `deprecated` flags. |
| `src/tools/<tool>/app/App.tsx` | Each tool's entry. |
| `src/shared/canvas/` | Shared by Market Map and Top List (see below). |
| `src/shared/components/ui/` | shadcn/Radix primitives. |
| `src/shared/utils/` | Google Sheets loading, image → data URL, Logo.dev, file saving. |
| `src/styles/` | Design tokens and per-tool CSS (see Brand). |
| `public/image-projects/`, `scripts/image/` | The Images tool's projects and CLI. |
| `public/video-projects/`, `scripts/video/` | The Video tool (HyperFrames). LinkedIn GIFs are projects with `"output": "gif"` (`gif:new`, `gif:render`, loop kit in `_gif/`). |
| `scripts/deck/`, `scripts/docs/`, `scripts/onepager/`, `scripts/menu/`, `scripts/banners/` | HTML → PDF/PNG/PPTX pipelines, no UI. |
| `scripts/merch/`, `public/merch-files/` | Button, pin and sticker artwork (`merch.html`, vendor specs in its header; sticker SVGs in `stickers/`) and its renders, for the Merch tab. |
| `content/` | Campaign markdown for the Content tool. |
| `docs/plans/` | One design doc per tool. Where a doc and the code disagree, the code wins. |
| `.claude/skills/` | `massive-image`, `massive-video`, `massive-gif`, `massive-deck`. Read the matching one before working on images, videos, GIFs or decks. |
| `originals/` | The first Figma Make exports. Reference only, not built. |

| Tool | Route | Code | Status |
|---|---|---|---|
| Market Map | `/market-map` | `src/tools/market-map/` (+ `market-map-legacy/`) | Live |
| Top List | `/top-list` (`/bento-map` redirects here) | `src/tools/top-list/` (+ `top-list-legacy/`) | Live |
| Images | `/images` | `src/tools/images/`, `public/image-projects/` | Live |
| Partnership Post, Logo Encoder | `/partnership-post`, `/logo-encoder` | `src/tools/…` | Live |
| Merch | `/merch` | `src/tools/merch/`, `scripts/merch/` | Live |
| Video, Content | `/video`, `/content` | `src/tools/…` | Dev server only |
| Trash | `/trash` | `src/tools/trash/` | URL only, not in the nav |
| Social Media, Campaign Designer, Dither | `/social-media`, … | `src/tools/…` | Deprecated: hidden from the nav, still routable |

### Market Map and Top List: shared canvas

Both turn a spreadsheet of companies into a branded JPG. They share `src/shared/canvas/`:

- `CanvasFrame.tsx` (title and subtitle header, "Presented by", theme class), `DesignPanel.tsx`,
  `SheetSidebar.tsx` (upload `.csv`/`.tsv`, paste a Google Sheets URL, Examples), `ThemePicker.tsx`.
- `themes.ts` and `sizes.ts`: the four themes (below) and three sizes: Vertical 1080×1350 (default), Square
  1080×1080, Horizontal 1920×1080.
- `useSheetLoader.ts` + `src/shared/utils/googleSheets.ts`: loads `?e=<sheet id or URL>` once on mount. The sheet
  must be shared as "Anyone with the link can view". `sheetText.ts` reads the `__TITLE__` and `__DATE__` rows and
  ignores every other `__` row.
- `remembered.ts`: localStorage `<tool>.version`, `<tool>.theme` and `<tool>.layout`.
- `ToolVersion.tsx`: the **New | Legacy** switch. Both versions live at the same URL; the pick is remembered per browser.
- `logos/`: a logo is looked up in this order: the sheet's own logo, Logo.dev, Google favicon, unavatar, DuckDuckGo,
  then initials (`InitialsLogo.tsx`). Logo.dev's token is read from the sheet's own `img.logo.dev` URLs; there's
  no env var.
- `edit/`: click-to-edit popovers, undo, Download/Copy TSV.
- `exportJpg.ts`: renders a 2× JPG with modern-screenshot. Every `<img>` is turned into a data URL first, through
  `/api/image-proxy` when CORS fails (a Vite plugin in dev and preview, `api/image-proxy.ts` on Vercel). An
  external URL left in the clone exports as a silent black image.
- `legibility.ts`, `measureText.ts`, `squarify.ts`: minimum text sizes for a phone feed, text measured in Outfit,
  and the treemap.

**Market Map** (`src/tools/market-map/app/`). Sheet columns: `category` (or `section`), `company` (or `name`),
`logo`, `url` (or `website`, used to look up a logo). Layouts, in the Design panel:
- **Columns** (default): `utils/columns.ts`, drawn by `CategoryCard` and `CompanyRow`.
- **Tiles**: a treemap in `utils/layout.ts` and `utils/pills.ts`, drawn by `CategoryTile` and `CompanyPill`.

Legacy themes force Columns. `?f=` opens the Legacy app. Examples are in `constants.ts`. Doc:
`docs/plans/market-map.md`.

**Top List** (`src/tools/top-list/app/`). Sheet columns: `position` (or `rank`), `name` (or `company`), `logo`,
`value` (or `valuation`, `market cap`), `url`. Views:
- **List** (default): `utils/list.ts`, or `utils/legacyList.ts` under a legacy theme.
- **Grid**: when every row has a readable value (`utils/value.ts`), tile areas follow the values (Bento:
  `utils/minArea.ts` + `squarify`). Otherwise the tiles are equal, in rank order (`utils/grid.ts`).

`TileCanvas.tsx` picks the layout, and `utils/tiers.ts` decides what a tile has room to show (logo, name,
description, value, rank). `utils/splitName.ts` splits "Name · description". Doc: `docs/plans/top-list.md`.

**Easy to break:**
- The legacy apps are frozen ("Not maintained") but still import `googleSheets`, `imageDataUrl`, `RichTextEditor`
  and `ToolVersion`. A change there reaches them too. `imageDataUrl.ts` is also used by Logo Encoder, Social Media
  and Dither.
- `themes.ts` `exportBg` repeats each theme's `--canvas-export-bg-image`. Change both together.
- Don't change `.canvas-light` / `.canvas-dark` to get a legacy look; the legacy apps and Partnership Post use them
  as they are. Use the `-legacy` classes.
- The Examples' Google Sheets must stay public.

### Images

`/images` (`src/tools/images/app/`) is a library of static HTML images with editable fields.

- **Each image is a folder**, `public/image-projects/<id>/`, with:
  - `index.html`: `#canvas` at the exact pixel size. It links `../_brand/massive.css` and loads
    `../_lib/image-kit.js` last.
  - `meta.json`: title, category, template, series, status, `width`/`height` (must match `#canvas`), and `fields`
    (`text | image | toggle | select`).
  - `assets/` and `thumb.jpg`.
- **Fields** are bound in the markup with `data-field` (text), `data-field-src` (image) and `data-field-show`
  (toggle). Anything derived goes in `window.onFields(values)`.
- **`index.json` is generated:** `npm run image:index` builds it from the folders, `categories.json` and
  `planned.json`. Don't edit it by hand.
- **UI:**
  - `Library.tsx`: search, group, filter and sort. State lives in the URL; `?i=` is the selected image.
  - `FieldsPanel.tsx`: edits are kept in localStorage `images:fields:<id>`.
  - `PreviewPane.tsx`: an iframe, plus the in-browser JPG export.
  - `PlannedCard.tsx`: planned images.
  - `hooks/useImageIndex.ts`: fetches `index.json`.
- **Commands:**
  - `npm run image:new <id> "<Title>" -- --format=portrait|square|landscape|vertical|x [--from=<id>]`, or
    `npm run image:new -- --plan=<planned-id>`.
  - `npm run image:render <id…>` (or `-- --all`): writes `output/images/<id>.jpg` and the project's `thumb.jpg`.
  - Then `npm run image:index`.
- Read `.claude/skills/massive-image/SKILL.md` before making or changing an image. It has the house style and the
  export rules (no `backdrop-filter`, `#canvas` has its own background, local fonts and images only).

## Brand: colours, type, themes

**Core palette.** Defined in `src/styles/theme-base.css` `:root`. The same values are in
`public/image-projects/_brand/massive.css` and `public/video-projects/_brand/lib/massive.css` (`--m-*`).

| Token | Value | Tailwind | Use |
|---|---|---|---|
| `--bg` | `#0a0a0f` | `bg-bg`, `bg-background` | Page background |
| `--surface` | `#121117` | `bg-surface`, `bg-card` | Panels, cards |
| `--surface-2` | `#1a1920` | `bg-surface-2`, `bg-secondary` | Raised surfaces, inputs |
| `--red` | `#d74939` | `bg-brand`, `bg-primary`, `ring` | The brand accent |
| `--red-light` | `#ff8163` | `text-brand-light` | Hover, highlights |
| `--text` | `#faf4ec` | `text-text-primary`, `text-foreground` | Cream text |
| `--text-mid` / `--text-dim` | cream at 75% / 55% | `text-text-mid` / `text-text-dim` | Secondary text |
| `--border-subtle` | cream at 8% | `border-border-subtle` | Borders |

- **Only in the image and video house styles:** paper `#f1ead8` and ink `#171615`. Red-deep `#b8321f` is in the image
  style only; paper-red `#d54635` / `#f3a07a` in the video style only.
- **Light designs: white cards on a very faint orange ground, not cream.**
  - Ground: `#fff7f2` (`.m-ground.soft-orange` + `.m-linegrid` in video and GIF projects), a whisper of the logo
    orange. Plain white is `.m-ground.light`.
  - Ink type and the paper-red accent.
  - Keep the tint subtle; stronger orange was too much.
  - The cream paper reads too close to Claude's palette, so don't start new designs on it.
- **The deck** (`scripts/deck/deck.css`) differs slightly: text at 72% / 48%, a page background of `#050508`, and no
  mono font.
- **The logo gradient isn't a token:** `#F69666` → `#F16D65` in `public/logo.svg` and `PresentedBy.tsx`, `#FF9964` →
  `#FF6E63` in `logo-positive.svg` / `logo-negative.svg`. Don't recolour it to `--red`.
- **The app UI is dark only.** shadcn's variables are mapped onto the palette above.

**Typography.**
- **Outfit for everything.** Headings 800/700 (`theme-base.css`), canvas titles 900, rich-text body 300 with bold 900
  (`theme-market-map.css`, `theme-top-list.css`).
- **JetBrains Mono only for code** (rule 4): commands, terminal output, file paths, cron lines, API parameters,
  hashes, inside `<code>`, `<pre>`, `<kbd>`, `<samp>` or `.m-code`. Eyebrows, labels, counters, badges, country codes
  and URLs are Outfit (uppercase and tracked for labels). Older images and videos break this; don't copy them.
- **Tailwind:** `font-display` / `font-body` = Outfit, `font-mono` = JetBrains Mono.
- **Two font loads, both needed:** Google Fonts loads Outfit in `index.html` (400–900) and in `src/styles/fonts.css`
  (300–800). Canvas text is measured in Outfit, so a font change also changes layouts.
- **Caveat** (handwriting) is a local font in `public/image-projects/_brand/fonts/`.

**Canvas themes.** In `src/styles/theme-canvas.css`; the list is in `src/shared/canvas/themes.ts`.

| Theme | Background | Card | Text | Accent | Export background |
|---|---|---|---|---|---|
| Light (default) | `#f5ece0` | `#faf4ec` | `#1a1b2a` | `#c9382a` | `/canvas-bg-light.jpg` |
| Dark | `#0d0c17` | `#1a1920` | `#faf4ec` | `#e05642` | `/bg.jpg` |
| Light Legacy / Dark Legacy | as above | | | | `/bg-light.jpg` / `/bg.jpg` |

The legacy themes reproduce the pre-revamp look and layout. Tools branch on `theme.legacy`, never on the id.

**Logos.**
- `public/logo.svg`: white wordmark, used in the header.
- `public/logo-negative.svg` / `logo-positive.svg`: for dark and light backgrounds.
- Image projects use `public/image-projects/_brand/logo-massive.svg` and `icon-massive*.svg`.
