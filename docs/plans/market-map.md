# Market Map

**Status:** Implemented in `src/tools/market-map/` (2026-09-28). It replaced the old slider-driven Market Map and is built on the same shared canvas pieces as [Top List](top-list.md).

## What it is

A tool that turns a spreadsheet of companies grouped by category into a branded market map:

- **One tile per category.** Each tile's size follows its content: more companies, or longer names, get a bigger tile. Tiles are packed edge to edge (a squarified treemap), largest first, and together fill the canvas.
- **Companies are pills.** Each pill shows the logo, then the name. Pills flow left to right inside the tile and wrap to a new row when the row is full.
- **Sizing is always automatic.** The pill size is the largest one (11–24 px) at which every tile holds its category name and pills. `__SETTING__` and `__COLUMNS__` rows in a sheet are ignored.

It shares the design system with Top List: canvas themes, the title and subtitle header, "Presented by", three sizes (Vertical 1080 × 1350 default, Square 1080 × 1080, Horizontal 1920 × 1080), the Design panel, Examples, Unload, and JPG export.

## Spreadsheet format

One row per company. Headers aren't case-sensitive.

| category | company | logo |
|---|---|---|
| Search APIs | Exa | https://example.com/logos/exa.png |
| Search APIs | Tavily | https://example.com/logos/tavily.png |
| Crawling | Firecrawl | https://example.com/logos/firecrawl.png |

| Column | Also accepted as | Notes |
|---|---|---|
| `category` | `section` | Groups companies into tiles. Categories keep the order they first appear in, then are laid out largest first. |
| `company` | `name` | Shown in the pill. |
| `logo` | `logo url`, `logo_url` | A direct image URL or a `data:` URL. A missing or broken logo shows the name's first letter. |

Optional `__TITLE__` and `__DATE__` rows set the title and subtitle, as in the other tools.

Rules:

- **Ignored, from the old format:** `url`, `stroke`, `subcompanies` and `columnGap` columns, and category-only rows (a category with no company, which used to carry per-category settings). None of the 11 real sheets checked used stroke colours, subcompanies or category logos.
- **Skipped rows:** a company with no category, or a row with neither. The sidebar lists each with its row number.
- **Duplicates:** the same company twice in one category is kept and reported.
- **Google Sheets:** the sheet must be shared as "Anyone with the link can view". Links that point at a specific tab (`gid=…` in the query or `#hash`) now load that tab. Before, the `gid` was dropped and the first tab always loaded.

## Layout

`utils/layout.ts`, `utils/pills.ts`: pure functions, re-run when the data, canvas size or fonts change.

1. **Pill geometry at font size `f`:** logo `1.4f` square, padding `0.35f` vertical and `0.6f` horizontal, `0.45f` between logo and name, no border. The gap between pills is `0.45f` in both directions. Widths are measured with canvas `measureText` (Outfit, regular 400 weight), so there are no DOM passes.
2. **Tile weights:** each category's pill boxes plus 15% slack for ragged rows, in a roughly square block. The block is never narrower than the widest pill or a third of the category name, which can wrap to three lines. Header and padding are added on top.
3. **Tiles:** a squarified treemap of the weights over the canvas, with the same 12 px gaps and flush outer edges as Top List's Bento.
4. **Fit and correct, both ways:** the pills are flowed into each tile. A tile that's too narrow for its widest pill or name, or too short for its rows, has its weight raised by what it's short. A tile whose content fills less than 75% of its height gives space back, shrinking towards 90% full. The layout runs again, up to 20 rounds, and keeps the fitting arrangement whose emptiest tile is fullest.
5. **Pill size:** a binary search finds the largest `f` between 11 px (`MIN_READABLE`) and 24 px that fits.
6. **When 11 px doesn't fit, pills are never cut off.** One of two fit modes applies, chosen with a toggle in the warning above Export:
   - **Shrink pills (default):** every company stays, and the pills go below 11 px, searching down to 4 px, then halving if ever needed. The warning gives the pill size and says it may be hard to read.
   - **Hide companies:** pills stay at 11 px and as few companies as possible are left out (a binary search on the count). Companies are taken one at a time, from the end of whichever category has the most left (ties: first in sheet order), and every category keeps at least one. Each trimmed category ends with a text-only "+N more" pill, which counts toward the fit. The warning says how many are hidden, and "Show hidden companies" lists them by category.

   On the 234-company YC Summer 2026 map: Shrink gives 10.7 px on Vertical and 9.0 px on Square; Hide leaves out 15 (Vertical) or 96 (Square). Horizontal fits all 234 at 13.1 px, so no warning.

Inside a tile, the category name sits in a pill centred at the top (`1.1f`, up to three balanced lines). The pill uses softened inverted tones, `--canvas-category-bg` / `--canvas-category-text`: warm charcoal `#5b544d` with cream text on Light, soft stone `#b9b1a6` with dark text on Dark. Each pill row is centred below it, and the block of rows is centred in the height left over.

In testing, all four examples fit at all three sizes with no clipping, at pill sizes from 12.9 px (AI Agents, 88 companies, Square) to 24 px (YC, Vertical and Horizontal).

**Why names wrap to three lines:** the treemap keeps tiles close to square. A long category name with few companies ("Supporting Infrastructure (Proxies & Browser Networks)", 3 companies) needs a wide name but little height. With names limited to two lines, its square tile came out about twice as tall as its content (58% full on AI Agents, Vertical). Allowing three balanced lines (`wrapLines` in `src/shared/canvas/measureText.ts`) lets it shrink to a compact tile, now about 75% full or more. Across the four examples, the emptiest tile is now 63–81% full. Tiles on maps that reach the 24 px pill cap (YC) keep spare room by design.

## Style

- **Tiles:** no fill, so the canvas background shows through, and a 2 px dashed `--canvas-border-15` outline with a 6 px radius.
- **Pills:** each pill has its own `--canvas-pill-bg` fill: a warm off-white (`#f6f0e8`) on Light, a dark `#221f27` on Dark. No outline; text `--canvas-text`, fully rounded, with a blurred wash of the company's logo on top.

## Export speed and progress

Shared with Top List (`src/shared/canvas/exportJpg.ts`, `src/shared/utils/imageDataUrl.ts`).

- **Logos load directly when their host allows it.** Hosts that send CORS headers (logo.dev does) load straight from the browser, in parallel over HTTP/2. The first image from a host finds out whether it allows this, and the rest follow; hosts that don't (e.g. Google's favicon service) go through the image proxy. Before, every logo went through the proxy, where the browser opens only about 6 connections to the dev server at a time.
- **Logos are prepared in the background.** When a sheet loads, `warmImageCache` starts converting its logos, so Download JPG usually finds them ready. Conversions are cached for the session and never requested twice at once.
- **Progress on the Download button:** "Preparing logos 190 / 233", then "Rendering image…", with a progress bar (logos take the first 70%, rendering the rest, using modern-screenshot's `progress` callback).

Measured on a 234-company map (YC Summer 2026, Vertical): about 4.5 s with no feedback before; now 2.4 s when Download is clicked right after loading, and 1.3 s once the logos are ready. 6 of 233 logos still go through the proxy.

## Sidebar

The shared `SheetSidebar` (see Top List): Design panel; Data ("N categories · M companies", skipped rows, duplicates); Import and Examples while nothing is loaded; **Unload map**; Download JPG.

Examples (`constants.ts`, from the Master Spreadsheet's Market Maps tab):

1. AI Agents: 15 categories, 88 companies
2. LLM Search Stack: 10 categories, 44 companies
3. Browser Infra: 7 categories, 62 companies. Its link points at a tab, so it also covers the `gid` fix.
4. YC Fall 2025: 4 categories, 1 to 23 companies each

## Removed from the old Market Map

Edit mode (drag and drop, add company, edit logo, subcompany editor), all sliders, Auto Fit / Auto Gaps / Auto-Adjust Columns, TSV export, the `?f=` embed mode with responsive `&r=1`, Generate Embed Code, stroke colours, subcompanies and category logos. `?e=<sheet>` still loads a sheet, which is how the dashboard's "Open" works.

## Warnings above Export

Shown in the Export area, right above Download JPG (`warnings` on `SheetSidebar`, drawn with `SidebarWarning`):

- **Fit warning** (Market Map, `components/FitWarning.tsx`): only when the map doesn't fit at 11 px. It has the Shrink / Hide toggle and, in Hide mode, the list of hidden companies.
- **Browser warning** (both tools, built into `SheetSidebar`): when the browser isn't Chromium-based (`isChromium()` in `src/shared/utils/browser.ts`). It says to use Chrome, Edge, Brave or Arc, because the export relies on SVG `foreignObject` rendering, which Safari and Firefox draw differently. Chrome on iOS runs on WebKit, so it counts as not Chromium.

## Files

```
src/tools/market-map/app/
  App.tsx                 state, loading, unload, export
  constants.ts            example sheets
  components/
    MapCanvas.tsx         measures the box, runs layoutMap, draws tiles
    CategoryTile.tsx      category name and its pills
    CompanyPill.tsx       logo + name pill
  utils/
    parseSheet.ts         columns, aliases, grouping by category
    pills.ts              pill geometry and left-to-right flow
    layout.ts             tile weights, treemap, fit-and-correct, pill size search

src/shared/canvas/        shared with Top List
  CanvasFrame.tsx         canvas fitted to the viewport, header, empty state
  SheetSidebar.tsx        the whole sidebar, including Import, Examples, Unload, Export
  useSheetLoader.ts       loadSheet, ?e= on open, clearSheetParam
  sheetText.ts            readSheetTable (metadata rows, aliases), escapeHtml, htmlToText
  sizes.ts                the three sizes, header spacing, tile gap
  squarify.ts, measureText.ts, DesignPanel.tsx, PresentedBy.tsx, exportJpg.ts, themes.ts
```
