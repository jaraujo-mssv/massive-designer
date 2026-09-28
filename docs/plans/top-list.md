# Top List

**Status:** Implemented in `src/tools/top-list/`. Bento Map (built first, at `/bento-map`) was merged into Top List on 2026-09-28. `/bento-map` now redirects to `/top-list`, and keeps any `?e=`.

## What it is

One tool that turns a spreadsheet of companies into a branded image. The layout is chosen automatically from the sheet:

- **Bento:** when the sheet has a value column, a **treemap** where each tile's **area is proportional to the company's value**. It follows the finviz market heatmap, with near-square tiles packed edge to edge, but with **no colour coding**. The only thing the map shows is relative size.
- **Grid:** otherwise, **equal tiles in rank order**, each with its rank number in the corner.

Both layouts use the same tiles and the same design system as Market Map: canvas themes, the title and subtitle header, the "Presented by" mark, and JPG export. Sizing is always automatic: `__SETTING__` and `__COLUMNS__` rows in a sheet are ignored.

## Spreadsheet format

One sheet, one header row. Headers aren't case-sensitive, and the aliases below also work.

A **grid** sheet (the usual top list):

| position | company | logo |
|---|---|---|
| 1 | Zyte | https://example.com/logos/zyte.png |
| 2 | Firecrawl | https://example.com/logos/firecrawl.png |

A **Bento** sheet, which is any sheet with a value column:

| name | logo | value |
|---|---|---|
| NVIDIA | https://example.com/logos/nvidia.png | 4.2T |
| Stripe | https://example.com/logos/stripe.png | 91.5B |
| Acme Robotics | https://example.com/logos/acme.png | ~$850M |

| Column | Required | Also accepted as | Notes |
|---|---|---|---|
| `name` | yes | `company` | Shown in a pill when there's room. |
| `logo` | yes | `logo url`, `logo_url` | A direct image URL (PNG, SVG, JPG) or a `data:` URL. Square logos look best. A missing or broken logo shows the name's first letter. |
| `position` | no | `rank` | Grid order. Without it, the sheet's row order is used. Ranks are renumbered 1..N. |
| `value` | no | `valuation`, `market cap` | **Switches the layout to Bento.** A plain number or shorthand: `4.2T`, `91.5B`, `850M`, `12K`. `$`, `,` and spaces are ignored. A leading `~` or `≈` marks an estimate and is kept on the tile (`~$361M`). |

Other columns (`url`, `category`…) are ignored. Optional metadata rows follow the same convention as the other tools:

```
__TITLE__	AI Infrastructure
__DATE__	September 2026
```

Rules:

- **Layout switch:** Bento when the value column exists and at least one row has a valid value. In Bento, rows without a valid value are skipped and listed.
- **Order:** Bento tiles are sorted by value, largest first. Grid tiles follow `position`, then row order.
- **Ignored metadata:** any other `__` row (`__COLUMNS__`, `__SETTING__…`), wherever it appears. Real top lists carry 25–36 of these; they no longer do anything.
- **Skipped rows:** a missing name, and in Bento a value that can't be read or is zero or less. The sidebar lists each one with its row number.
- **Duplicate names:** both rows are kept as separate tiles, and a warning is shown.
- **Currency:** Bento tiles show a compact value such as `$4.2T`. If the sheet's values use another symbol (such as `€`), that symbol is used instead.
- **Google Sheets:** the sheet must be shared as "Anyone with the link can view". Import by URL, or open `/top-list?e=<sheet id or url>`. The dashboard's "Open in editor" uses the `?e=` link.
- **Examples:** the Import section lists example sheets with **Load** and **Open** (`EXAMPLES` in `constants.ts`): the AI Infrastructure Bento sheet, and three top lists from the Master Spreadsheet (Top Frontier AI Labs, which has valuations and becomes a Bento map; 10 Web Scraping APIs; Top 10 AI SDRs). They must stay shared as "Anyone with the link can view".

## Bento layout

A **squarified treemap** (Bruls, Huizing & van Wijk, 2000). It lays tiles out in rows, choosing each row so the tiles stay as close to square as possible. That's what gives the finviz look, and it keeps logos readable.

- Written in-house as a pure function in `utils/squarify.ts`: `(items sorted by value, rect) → rects`. It's about 60 lines, easy to test, and adds no dependency.
- **Area is linear in value**, so the map stays truthful. Square-root scaling would make the tail more readable but would misstate relative size, so it isn't used.
- **Gaps:** each tile is inset by half the gap after layout. The gap is 12 px. It takes proportionally more area from small tiles than from large ones: a minimum-size tile loses about 13% of its area, the largest about 5%. That's the trade-off for clearer separation between tiles.
- **Pixel snapping:** tile edges are rounded to whole pixels after layout, so neighbouring tiles share exact edges and the export has no hairline seams.
- The layout is recomputed from `(items, canvas size)` in a `useMemo`. It's instant, so there's no fit-and-measure loop like Market Map's.

### Minimum tile size

With real valuations, the gap between the biggest and smallest companies can be 1,000× or more, so some tiles would end up only a few pixels wide. Maps have few companies, so every company keeps its own tile, and no tile gets less than a minimum area (`utils/minArea.ts`):

1. Each tile's target area is `value / total × canvas area`.
2. The minimum is `minTileSide²`: 180 px for Square and 190 px for Horizontal, so every tile has room for its logo and value.
3. Tiles below the minimum are pinned at it, and the rest of the area is shared between the other tiles by value. This repeats until no new tile falls below the line.
4. If the minimums alone would take more than half the canvas, the minimum is lowered so the large tiles still dominate.

Enlarged tiles are no longer to scale, so the sidebar says how many there are. The minimum guarantees area, not width: a small tile at the end of a row can be a little narrower than `minTileSide` (about 121 px in testing), which still leaves room for a logo and value.

## Grid layout

`utils/grid.ts`: equal tiles in `ceil(√n)` columns (2×2, 3×3, 4×4…) and as many rows as needed.

- **Short last row:** when the last row isn't full, its tiles stretch to fill it. 10 companies read 4 + 4 + 2, with the bottom two tiles twice as wide.
- **Same content size everywhere:** every tile's logo and text are sized from a regular full-row tile, so the stretched bottom tiles don't look bigger than rank 1. Names still get the stretched tile's full width to fit in.
- **Rank:** a regular-weight number in `--canvas-text-70` in the top-left corner, sized `clamp(short side × 0.09, 14, 36)`. The centred content keeps that height clear above and below it.
- **Shared with Bento:** grid rects go through the same `insetAndSnap` as the treemap, with the same 12 px gap, and outer tiles are flush with the edges.

## Responsive tiles

Each tile picks how much to show based on **its own pixel size**, not the canvas size. That's what keeps the design working at both canvas sizes and for any number of companies.

Every tile aims to show **logo, name and value**: stacked, or side by side on wide tiles.

- On small tiles the logo shrinks first, to make room for the two text lines.
- Text is only given up when the logo would fall below 32 px: the name first, then the value.
- With the minimum tile size this rarely happens. In testing with 12 companies, half of the Square tiles were held at the minimum (about 154 × 200 px), each with a 44–53 px logo, its name and its value.

- **Scaling:** logo size is the tile's short side × 0.34, kept between 44 and 160 px. The value's font size grows with the square root of the tile's area, kept between 20 and 56 px, and the name is 72% of that (at least 17 px). Big companies get visibly bigger type, and small ones stay legible.
- **Wide, short tiles** (width more than 2.2× height) place the logo to the left of the text instead of above it.
- **Names are shown in full.** `utils/measureText.ts` measures text with canvas `measureText` and the Outfit font, after `document.fonts.ready`, so fitting costs no DOM re-renders. In order of preference, a name gets:
  1. one line at the tile's name size;
  2. two lines, split at the word break that balances them best (`wrapTwoLines`), with the pill becoming a rounded box;
  3. the same two options at smaller sizes, 1 px at a time, down to 12 px.

  Each option must still leave room for a 32 px logo. Only a name that fits none of these, such as one very long word, is shortened with "…". In testing, every name on Top Frontier AI Labs (17 companies) showed in full at all three sizes.
- **Tiles are absolutely positioned `<div>`s with `<img>` logos**, not SVG. The existing JPG export (`modern-screenshot` plus the image proxy) then works exactly as it does in the other tools.

## Canvas and design

- **Sizes:** **Vertical 1080 × 1350** (default), **Square 1080 × 1080** and **Horizontal 1920 × 1080**.
- **Frame:** the title and subtitle header at the top and "Presented by" in the corner, same as Market Map. The treemap fills the rest of the canvas.
- **Themes:** the shared theme list in `src/shared/canvas/themes.ts`: Dark and Light for now. The two placeholder themes from [auto-sizing-design-panel.md](auto-sizing-design-panel.md) are added there, and Top List picks them up automatically.
  - Tiles use `--canvas-card-bg` with a 2 px `--canvas-border-15` outline, and the gaps show `--canvas-bg`.
  - **Logo wash (experimental):** behind the content, each tile shows its own logo scaled to cover the tile, blurred (18% of the tile's short side, 24–80 px), colour-boosted (`saturate(1.4)`) and at 25% opacity (`LOGO_WASH_OPACITY` in `Tile.tsx`), so the tile takes on the logo's colours and neighbouring tiles differ in shade. (It replaced an earlier 0–7% overlay whose strength came from the company name.) The blurred image overhangs the tile by twice the blur and is clipped, so the tint reaches the edges. It survives the JPG export.
  - The name sits in a pill that follows the theme: `--canvas-card-bg-2` fill, `--canvas-text` text and a `--canvas-border-15` outline (a dark pill with light text on Dark, a light pill with dark text on Light). Its padding scales with the name's font size, and names are fitted to the width left inside the pill. The value is plain text in `--canvas-text-70` below it.
- **Logo contrast:** a dark logo on the Dark theme can disappear. Not built yet: logos sit directly on the tile, as in Top List. If it becomes a problem, add a per-theme logo chip.

## Sidebar

It uses the shared **Design** panel, with no spreadsheet switch because sizing is always automatic:

- **Size:** Vertical / Square / Horizontal
- **Theme:** the theme selector
- **Show "Presented by":** a switch
- **Data:** the company count and which layout was chosen, skipped rows with reasons, duplicate names, and (Bento) how many tiles are shown at minimum size
- **Import:** CSV/TSV file, Google Sheets URL, a column hint, and the Examples list (Load / Open); shown only while no list is loaded
- **Unload list:** in the Data section once a list is loaded. It clears the canvas, resets the title and subtitle, brings Import back, and drops `?e=` from the address so a refresh doesn't reload the sheet
- **Export:** Download JPG

There's no edit mode or drag and drop: the spreadsheet is the source of truth. The title and subtitle are still editable on the canvas. The old Top List's edit mode, TSV export, Thumbnail layout and sliders were removed in the merge.

## Files

```
src/tools/top-list/app/
  App.tsx                 state, loading, unload, export
  constants.ts            per-size presets, example sheets
  components/
    TileCanvas.tsx        picks the layout, places and renders the tiles
    Tile.tsx              logo, name pill, value or rank, logo wash
  utils/
    parseSheet.ts         header aliases, layout switch, ordering
    minArea.ts            proportional areas with a minimum tile size (pure)
    grid.ts               equal-tile grid with a stretched last row (pure)
    value.ts              parses "4.2T" / "$1,200" → number; formats back to compact form
    tiers.ts              tile size → logo size, font sizes, what fits
```

Shared with Market Map, in `src/shared/canvas/`: `CanvasFrame` (canvas, header, empty state), `SheetSidebar` (the whole sidebar), `useSheetLoader` (`?e=`, loading, unload), `sheetText` (metadata rows, header aliases), `sizes`, `squarify`, `measureText`, `DesignPanel`, `PresentedBy`, `exportJpg` and `themes`. See [market-map.md](market-map.md).

Also: the route in `src/router/index.tsx` (plus the `/bento-map` redirect) and the nav link in `Header.tsx`.

## Decisions

1. **Sizes:** Square 1080 × 1080 and Horizontal 1920 × 1080. (Square was the default until the merge; see 6.)
2. **Small companies:** keep their own tiles, with a minimum tile size.
3. **Tile text:** logo, name and value only. No share of the total.
4. **Grouping:** out of scope for now. An optional `group` column could add sector groups later without breaking three-column sheets.
5. **Merged into Top List** (2026-09-28): one tool named Top List, switching to Bento automatically when there's a value column, with sizing always automatic.
6. **Vertical size:** 1080 × 1350, the default.
7. **Grid:** equal tiles in 2×2 / 3×3 / 4×4 grids, with a short last row stretched, and a rank number in each tile's corner (later made lighter and smaller).
8. **Removed:** the old Top List's edit mode, TSV export and Thumbnail layout.
9. **Examples:** a few picked sheets, not a live list from the Master Spreadsheet.
