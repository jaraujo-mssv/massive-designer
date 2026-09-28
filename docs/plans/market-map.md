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

1. **Pill geometry at font size `f`:** logo `1.4f` square, padding `0.35f` vertical and `0.6f` horizontal, `0.45f` between logo and name, 1 px border. The gap between pills is `0.45f` in both directions. Widths are measured with canvas `measureText` (Outfit, regular 400 weight), so there are no DOM passes.
2. **Tile weights:** each category's pill boxes plus 15% slack for ragged rows, in a roughly square block. The block is never narrower than the widest pill or about half the category name, which can wrap to two lines. Header and padding are added on top.
3. **Tiles:** a squarified treemap of the weights over the canvas, with the same 12 px gaps and flush outer edges as Top List's Bento.
4. **Fit and correct:** the pills are flowed into each tile. A tile that's too narrow for its widest pill or header, or too short for its rows, has its weight raised by what it's short, and the layout runs again (up to 12 rounds).
5. **Pill size:** a binary search finds the largest `f` between 11 and 24 px that fits. If nothing fits at 11 px, the map is drawn anyway and the sidebar says so, suggesting Horizontal.

Inside a tile, the category name (regular 400 weight, `1.15f`, up to two lines, in the brand orange-red `--canvas-red`) is centred at the top. Each pill row is centred below it, and the block of rows is centred in the height left over.

In testing, all four examples fit at all three sizes with no clipping, at pill sizes from 12.9 px (AI Agents, 88 companies, Square) to 24 px (YC, Vertical and Horizontal).

**Known limit:** the correction step only grows tiles that are short on room; it never shrinks tiles with spare room. A category with a long name and few companies can end up with a roomier tile than it needs (for example, "Supporting Infrastructure" on AI Agents, Vertical).

## Style

- **Tiles:** no fill, so the canvas background shows through, and a 2 px dashed `--canvas-border-15` outline with a 6 px radius.
- **Pills:** each pill has its own fill, in Top List's name-pill style: `--canvas-card-bg-2` fill, `--canvas-border-15` outline, `--canvas-text`, fully rounded.

## Sidebar

The shared `SheetSidebar` (see Top List): Design panel; Data ("N categories · M companies", skipped rows, duplicates, overflow note); Import and Examples while nothing is loaded; **Unload map**; Download JPG.

Examples (`constants.ts`, from the Master Spreadsheet's Market Maps tab):

1. AI Agents: 15 categories, 88 companies
2. LLM Search Stack: 10 categories, 44 companies
3. Browser Infra: 7 categories, 62 companies. Its link points at a tab, so it also covers the `gid` fix.
4. YC Fall 2025: 4 categories, 1 to 23 companies each

## Removed from the old Market Map

Edit mode (drag and drop, add company, edit logo, subcompany editor), all sliders, Auto Fit / Auto Gaps / Auto-Adjust Columns, TSV export, the `?f=` embed mode with responsive `&r=1`, Generate Embed Code, stroke colours, subcompanies and category logos. `?e=<sheet>` still loads a sheet, which is how the dashboard's "Open" works.

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
