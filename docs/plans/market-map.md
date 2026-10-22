# Market Map

**Status:** Implemented in `src/tools/market-map/` (2026-09-28). It replaced the old slider-driven Market Map and is built on the same shared canvas pieces as [Top List](top-list.md).

## What it is

A tool that turns a spreadsheet of companies grouped by category into a branded market map, in one of two layouts (**Layout** in the Design panel, kept across loads):

- **Columns (default):** categories stacked in columns, with thin rules between categories and between columns. Each lists its companies one per line, each a slim pill with its logo and name. See Columns layout below.
- **Tiles:** one tile per category, packed edge to edge in a squarified treemap and together filling the canvas. Each tile's size follows its content. Companies are pills that flow left to right and wrap to a new row.
- **Sizing is always automatic.** The name size is the largest at which everything fits. `__SETTING__` and `__COLUMNS__` rows in a sheet are ignored.

**Which to use:** Columns gives bigger names on most maps (measured below). Tiles suits a few big categories, like the YC example.

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
| `logo` | `logo url`, `logo_url` | A direct image URL or a `data:` URL ([Logo Encoder](logo-encoder.md) makes one from any image). A missing or broken logo shows the name's first letter. |

Optional `__TITLE__` and `__DATE__` rows set the title and subtitle, as in the other tools.

Rules:

- **Ignored, from the old format:** `url`, `stroke`, `subcompanies` and `columnGap` columns, and category-only rows (a category with no company, which used to carry per-category settings). None of the 11 real sheets checked used stroke colours, subcompanies or category logos.
- **Skipped rows:** a company with no category, or a row with neither. The sidebar lists each with its row number.
- **Duplicates:** the same company twice in one category is kept and reported.
- **Google Sheets:** the sheet must be shared as "Anyone with the link can view". Links that point at a specific tab (`gid=…` in the query or `#hash`) now load that tab. Before, the `gid` was dropped and the first tab always loaded.

## Tiles layout

`utils/layout.ts`, `utils/pills.ts`: pure functions, re-run when the data, canvas size or fonts change.

1. **Pill geometry at font size `f`:**
   - Logo `1.3f` square, padding `0.22f` vertical and `0.45f` horizontal, `0.4f` between logo and name, no border.
   - Gaps between pills: `0.35f` across, `0.3f` down.
   - Tile padding: `0.6f` (8–16 px).
   - Widths are measured with canvas `measureText` (Outfit), so there are no DOM passes.
   - These were tightened on 2026-10-22, from logo `1.4f`, padding `0.35f`/`0.6f`, gaps `0.45f`, tile padding `f` (10–22 px) and tiles 75–90% full. Names came out about 16% bigger on every example, e.g. AI Agents Vertical 4.6 → 5.4 pt on a phone.
2. **Tile weights:** each category's pill boxes plus 15% slack for ragged rows, in a roughly square block. The block is never narrower than the widest pill or a third of the category name, which can wrap to three lines. Header and padding are added on top.
3. **Tiles:** a squarified treemap of the weights over the canvas, with the same 12 px gaps and flush outer edges as Top List's Bento.
4. **Fit and correct, both ways:** the pills are flowed into each tile. A tile that's too narrow for its widest pill or name, or too short for its rows, has its weight raised by what it's short. A tile whose content fills less than 85% of its height gives space back, shrinking towards 95% full. The layout runs again, up to 20 rounds, and keeps the fitting arrangement whose emptiest tile is fullest.
5. **Pill size:** a binary search finds the largest `f` between 11 px (`MIN_READABLE`) and 24 px that fits.
6. **When 11 px doesn't fit, pills are never cut off.** One of two fit modes applies, chosen with a toggle in the warning above Export:
   - **Shrink names (default):** every company stays, and the pills go below 11 px, searching down to 4 px, then halving if ever needed. The warning gives the pill size and says it may be hard to read.
   - **Hide companies:** pills stay at 11 px and as few companies as possible are left out (a binary search on the count). Companies are taken one at a time, from the end of whichever category has the most left (ties: first in sheet order), and every category keeps at least one. Each trimmed category ends with a text-only "+N more" pill, which counts toward the fit. The warning says how many are hidden, and "Show hidden companies" lists them by category.

   On the 234-company YC Summer 2026 map: Shrink gives 10.7 px on Vertical and 9.0 px on Square; Hide leaves out 15 (Vertical) or 96 (Square). Horizontal fits all 234 at 13.1 px, so no warning.

Inside a tile, the category name is centred at the top as plain bold text (`1.1f`, 700, up to three balanced lines), in `--canvas-category`. Each pill row is centred below it, and the block of rows is centred in the height left over. (Until 2026-10-22 the name sat in a filled pill.)

**Known weakness:** a tile with few companies but a long name can still get more area than it needs. On AI Agents, Vertical, "Supporting Infrastructure (Proxies & Browser Networks)" (3 companies) is the big top-left tile. The treemap can only give space back gradually.

**Why names wrap to three lines:** the treemap keeps tiles close to square. A long category name with few companies ("Supporting Infrastructure (Proxies & Browser Networks)", 3 companies) needs a wide name but little height. With names limited to two lines, its square tile came out about twice as tall as its content (58% full on AI Agents, Vertical). Allowing three balanced lines (`wrapLines` in `src/shared/canvas/measureText.ts`) lets it shrink to a compact tile, now about 75% full or more. Across the four examples, the emptiest tile is now 63–81% full. Tiles on maps that reach the 24 px pill cap (YC) keep spare room by design.

## Style

- **Category names:** plain bold text, no pill, in `--canvas-category`. It's the accent (`--canvas-red`, the subtitle's colour): `#c9382a` on Light, `#e05642` on Dark. That sets the names apart from the company names (`--canvas-text`). Until 2026-10-22 it was warm charcoal / soft stone.
- **Tiles:** no fill, so the canvas background shows through, and a 2 px solid `--canvas-border-strong` outline with a 6 px radius. The treemap needs the outlines to hold its shape.
- **Columns:** no cards. 2 px `--canvas-border-strong` rules run between categories stacked in a column, and between columns over the full height of the block.
- **Pills:** each pill has its own `--canvas-pill-bg` fill: a warm off-white (`#f6f0e8`) on Light, a dark `#221f27` on Dark. No outline; text `--canvas-text`, fully rounded, with a blurred wash of the company's logo on top (`components/PillWash.tsx`, shared by both layouts).
- **Legacy themes:** the old tool's filled cards and plain names (see Columns layout below).

## Themes

Four themes, shared with Top List (`src/shared/canvas/themes.ts`): **Dark**, **Light**, **Dark Legacy** and **Light Legacy**. Each theme is a `.canvas-<id>` class of `--canvas-*` variables in `src/styles/theme-canvas.css`.

- **The legacy themes recreate the pre-revamp tools' look.** In Market Map they're always drawn in Columns, the old tool's arrangement, so the Layout control is hidden while one is picked. The old tools used the same palettes as Dark and Light, so the legacy classes share those colours through grouped selectors.
  - Only two things are set apart. Light Legacy uses the old flat cream grid (`/bg-light.jpg`, without the glow), and `--canvas-legacy-card-border` carries the old card stroke: `#2c2a30` on dark, `--canvas-border` on light.
  - The rest of the old recipe lives in components, switched by the theme's `legacy` flag, so tools never compare theme ids.
  - Nothing is added to `.canvas-dark` / `.canvas-light`, which the frozen Legacy apps and Partnership Post also use.
- **Picker:** the Design panel shows the themes as a sideways-scrolling row of cards (`src/shared/canvas/ThemePicker.tsx`).
  - Each card is a small live preview drawn inside that theme's class, so it always matches the canvas. Each tool supplies its own mock (`components/ThemePreview.tsx`). Market Map's follows the chosen Layout, and its legacy cards always show the old columns.
  - The row is a Radix radio group (arrow keys move and select).
  - An edge fade and arrow buttons show when there's more to scroll.
  - Picking a card scrolls only the row, never the sidebar. It has no scroll snapping, which would pull a card scrolled part-way into view back out.
  - On phones, sideways swipes scroll the row instead of dragging the drawer (`data-vaul-no-drag`).
- **Theme and Layout switches close any open edit popover:** its anchor goes away when the map is drawn again.
- The theme's label is part of the exported file name, e.g. "LLM Search Stack - Q1 2026 - Dark Legacy - Square".
- **Remembered per browser** (`src/shared/canvas/remembered.ts`, in localStorage):
  - Both tools open in **New**, or in the version last picked: `market-map.version` / `top-list.version`.
  - Each tool keeps its own theme and layout: `market-map.theme`, `market-map.layout`, `top-list.theme`, `top-list.layout`.
  - A legacy `?f=` embed link still opens in Legacy without changing what's remembered.
  - Blocked storage (e.g. private windows) just falls back to the defaults.

## Columns layout

The pre-revamp tool's arrangement: columns of category cards, each listing its companies one per line (`utils/columns.ts`, `components/CategoryCard.tsx`, `components/CompanyRow.tsx`). The old tool sized everything by hand. Here the column count and font size are automatic, with the same fit modes and click-to-edit targets as the tiles.

Two looks share it (`ColumnLook`):

- **Modern (Dark, Light):**
  - **No card:** the category name is plain bold text at the top left, in `--canvas-category`. The rows reach the column's edges.
  - **Rules (`separators` in `ColumnsLayout`, drawn by MapCanvas):** centred in the gap between stacked categories and in the gutter between columns. The vertical rules run the block's full height.
  - **Gutter:** the old side padding moved into it (column gap = gap + 2 × padding), so a rule has room either side.
  - **Companies:** each a slim pill as wide as its sub-column, tinted by its logo, name at 500 weight. A row is about 1.7 names tall with its gap, close to the old tool's 1.75.
  - **Long names:** a two-line name turns its pill into a rounded box.
- **Legacy (Dark Legacy, Light Legacy):**
  - **Card:** `--canvas-card-bg` fill, a 3 px solid `--canvas-legacy-card-border` stroke, 8 px radius and the old `shadow-sm`.
  - **Category name:** bold (700) plain text at the top left.
  - **Companies:** logo then name (400, `--canvas-text-85`), with nothing around them.

Proportions, as multiples of the name size `f`. Legacy is the old tool's at its 16 px names.

| | Modern | Legacy |
|---|---|---|
| Category name | `1.1f`, 700, plain, `--canvas-category` | `1.0f`, 700, plain, `--canvas-text` |
| Logo | `1.2f` | `1.5f` |
| Logo gap | `0.35f` | `0.75f` |
| Row padding | `0.35f` / `0.14f` (the pill) | none |
| Row gap | `0.22f` | `0.25f` |
| Padding above and below, between name and rows | `clamp(0.5f, 8, 16)` | `clamp(0.75f, 12, 28)` |
| Side inset | 0 | the padding |
| Column gap | gap + 2 × padding | gap |
| Card | none; 2 px rules between categories and columns | 3 px border, 8 px radius |

- **Names:**
  - One line; else two balanced lines; else the words that fit on line one and the rest cut with "…".
  - Big categories split into up to three sub-columns (one per 4 companies), but only when every name still fits on one line.
- **Arrangement:**
  - Cards go into columns masonry-style in sheet order, each into the shortest column so far, so the first row reads left to right like the old round-robin.
  - When that overflows, cards are placed tallest first instead (the old Auto-Adjust), then put back in sheet order within each column.
- **Search:** for 1 to 8 columns (Horizontal runs out of height long before width), a binary search finds the largest `f` that fits, up to `1.5 × minFont`. Counts within 2% of the best `f` are compared by how well they fill the canvas, then the fewest columns win. This keeps a sparse map from becoming one tall column of wide cards or one short row.
- **Fit modes and warning:** the same tiers as `layoutMap`. Hide mode adds "+N more" rows, and FitInfo (name size, readable, hidden) feeds the same warning, now worded as "Shrink names" / "names".
- **Spare height:** spread between rows (up to 3× the row gap), then between cards (up to 2× the gap), as the old auto-gaps did. The block is centred in whatever is left.
  - In the modern look, a column shorter than the tallest is also centred within the block, so its leftover room is split above and below instead of left as a gap at the bottom (e.g. YC F25's second column on Vertical).
  - Legacy columns stay top-aligned, as the old tool's were.
- **Measured on the examples (2026-10-22, with plain names and rules):** name size on a phone, in pt (readable from 10). "Tiles before" is the layout before the tightening; "coverage" is the share of the map the companies cover.

  | Map | Size | Columns | Legacy | Tiles | Tiles before |
  |---|---|---|---|---|---|
  | AI Agents (88) | Vertical | **6.2** | 5.9 | 5.5 | 4.6 |
  | | Square | **5.1** | 4.8 | 5.0 | 4.4 |
  | | Horizontal | **4.0** | 3.7 | 3.8 | 3.2 |
  | LLM Search Stack (44) | Vertical | **8.3** | 7.8 | 7.0 | 5.9 |
  | | Square | 6.8 | **6.9** | 6.4 | 5.7 |
  | | Horizontal | **5.8** | 5.7 | 4.8 | 4.1 |
  | Browser Infra (62) | Vertical | **8.6** | 8.3 | 7.9 | 6.5 |
  | | Square | **7.3** | 6.7 | 6.6 | 5.7 |
  | | Horizontal | 5.1 | 5.0 | **5.4** | 4.4 |
  | YC F25 (42) | Vertical | 9.0 | 8.4 | **11.1** | 9.1 |
  | | Square | 6.8 | 6.5 | **9.7** | 7.7 |
  | | Horizontal | 6.4 | 5.6 | **7.4** | 6.3 |

  - **Coverage:** Columns 39–52%, the tiles 21–40%.
  - **Effect of this change:** dropping the category pill and the card borders gained a little everywhere (Columns AI Agents Vertical 6.1 → 6.2 pt, Tiles 5.4 → 5.5 pt).
  - **Hide fallback:** with 15 categories on Square, even one company per category doesn't fit readably in columns, so Hide falls back to shrinking (as `layoutMap` does).

## Export speed and progress

Shared with Top List (`src/shared/canvas/exportJpg.ts`, `src/shared/utils/imageDataUrl.ts`).

- **Logos load directly when their host allows it.** Hosts that send CORS headers (logo.dev does) load straight from the browser, in parallel over HTTP/2. The first image from a host finds out whether it allows this, and the rest follow; hosts that don't (e.g. Google's favicon service) go through the image proxy. Before, every logo went through the proxy, where the browser opens only about 6 connections to the dev server at a time.
- **Logos are prepared in the background.** When a sheet loads, `warmImageCache` starts converting its logos, so Download JPG usually finds them ready. Conversions are cached for the session and never requested twice at once.
- **Progress on the Download button:** "Preparing logos 190 / 233", then "Rendering image…", with a progress bar (logos take the first 70%, rendering the rest, using modern-screenshot's `progress` callback).

Measured on a 234-company map (YC Summer 2026, Vertical): about 4.5 s with no feedback before; now 2.4 s when Download is clicked right after loading, and 1.3 s once the logos are ready. 6 of 233 logos still go through the proxy.

## Sidebar

The shared `SheetSidebar` (see Top List): Design panel; Data ("N categories · M companies", skipped rows, duplicates); Import and Examples while nothing is loaded; **Unload map**; Download JPG. On phones the sections open in a drawer and Download sits in a bottom bar (see [mobile-layout.md](mobile-layout.md)).

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
- **Logo.dev warning** (both tools, built into `SheetSidebar`): when the sheet has more than 100 distinct logos from `img.logo.dev` (`countLogoDevUrls` in `src/shared/utils/logoDev.ts`). Logo.dev serves 100 logos per minute, so past that some may not load. Each tool passes its logo URLs as `logoUrls`.
- **Browser warning** (both tools, built into `SheetSidebar`): when the browser isn't Chromium-based (`isChromium()` in `src/shared/utils/browser.ts`). It says to use Chrome, Edge, Brave or Arc, because the export relies on SVG `foreignObject` rendering, which Safari and Firefox draw differently. Chrome on iOS runs on WebKit, so it counts as not Chromium. On iPhone and iPad, where no browser is Chromium, it says to export the final file from Chrome on a computer instead (`isIOS()`).

## Files

```
src/tools/market-map/app/
  App.tsx                 state, loading, unload, export, the Layout control
  constants.ts            example sheets
  components/
    MapCanvas.tsx         measures the box, runs layoutColumns or layoutMap, draws the cards or tiles
    CategoryCard.tsx      Columns: a category card (modern or legacy look) and its rows
    CompanyRow.tsx        Columns: a company, as a slim pill (modern) or logo + name (legacy)
    CategoryTile.tsx      Tiles: category name and its pills
    CompanyPill.tsx       Tiles: logo + name pill
    PillWash.tsx          the blurred logo behind a pill, for both layouts
    ThemePreview.tsx      the mini map on each theme card, in the chosen layout
  utils/
    parseSheet.ts         columns, aliases, grouping by category
    columns.ts            Columns: card sizes per look, packing, column count and name size search
    pills.ts              Tiles: pill geometry and left-to-right flow
    layout.ts             Tiles: tile weights, treemap, fit-and-correct, pill size search

src/shared/canvas/        shared with Top List
  CanvasFrame.tsx         canvas fitted to the viewport, header, empty state
  SheetSidebar.tsx        the whole sidebar, including Import, Examples, Unload, Export; wraps the canvas (SidebarLayout)
  useSheetLoader.ts       loadSheet, ?e= on open, clearSheetParam
  sheetText.ts            readSheetTable (metadata rows, aliases), escapeHtml, htmlToText
  sizes.ts                the three sizes, header spacing, tile gap
  themes.ts               the four themes and their `legacy` flag
  ThemePicker.tsx         the row of theme cards, and the mock pieces the tools' previews use
  squarify.ts, measureText.ts, DesignPanel.tsx, PresentedBy.tsx, exportJpg.ts
```
