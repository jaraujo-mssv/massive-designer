# Plan: Bento Map

**Status:** Implemented in `src/tools/bento-map/`. The decisions below are the ones confirmed before the build.

## What it is

A new tool at `/bento-map` that draws a **treemap** of companies from a spreadsheet: one tile per company, and each tile's **area is proportional to the company's valuation**. The look follows the finviz market heatmap, with near-square tiles packed edge to edge, but with **no colour coding**. Every tile has the same fill. The only thing the map shows is relative size.

It uses the same design system as Top List and Market Map: canvas themes, the title and subtitle header, the "Presented by" mark, and JPG export.

## Spreadsheet format

One sheet, one header row, three columns. Headers aren't case-sensitive, and the common aliases below also work.

| name | logo | value |
|---|---|---|
| NVIDIA | https://example.com/logos/nvidia.png | 4.2T |
| Microsoft | https://example.com/logos/microsoft.png | $3,650,000,000,000 |
| Stripe | https://example.com/logos/stripe.png | 91.5B |
| Acme Robotics | https://example.com/logos/acme.png | 850M |

| Column | Required | Also accepted as | Notes |
|---|---|---|---|
| `name` | yes | `company` | Shown on the tile when there's room. |
| `logo` | yes | `logo url`, `logo_url` | A direct image URL (PNG, SVG, JPG). Square logos with transparent backgrounds look best. |
| `value` | yes | `valuation`, `market cap` | A plain number or shorthand: `4.2T`, `91.5B`, `850M`, `12K`. `$`, `,` and spaces are ignored. A leading `~` or `≈` marks an estimate and is kept on the tile (`~$361M`). |

Optional metadata rows at the very top follow the same convention as the other tools:

```
__TITLE__	AI Infrastructure
__DATE__	September 2026
```

Rules:

- **Order doesn't matter.** Tiles are always sorted by value, largest first.
- **Skipped rows:** rows with a missing name, a value that can't be read, or a value of zero or less. A toast says how many were skipped.
- **Duplicate names:** both rows are kept as separate tiles, and a warning is shown.
- **Currency:** tiles show a compact value such as `$4.2T`. If the sheet's values use another symbol (such as `€`), that symbol is used instead.
- **Google Sheets:** the sheet must be shared as "Anyone with the link can view". Import by URL works the same as in Top List (`?e=<sheet id or url>` also works).
- **Template:** an example Google Sheet ([AI Infrastructure](https://docs.google.com/spreadsheets/d/1RPXro_8DAOgbYXVb01TXDqMkEk2NHdY_CbM7Jp2DExM/edit?usp=sharing), set as `TEMPLATE_SHEET_URL` in `constants.ts`). **Load template** loads it into the tool, and **Open template spreadsheet** opens it so it can be copied. It must stay shared as "Anyone with the link can view".

## Layout algorithm

A **squarified treemap** (Bruls, Huizing & van Wijk, 2000). It lays tiles out in rows, choosing each row so the tiles stay as close to square as possible. That's what gives the finviz look, and it keeps logos readable.

- Written in-house as a pure function in `utils/squarify.ts`: `(items sorted by value, rect) → rects`. It's about 60 lines, easy to test, and adds no dependency.
- **Area is linear in value**, so the map stays truthful. Square-root scaling would make the tail more readable but would misstate relative size, so it isn't used.
- **Gaps:** each tile is inset by half the gap after layout. At small sizes this takes a little more area from small tiles than from large ones. That's acceptable, but it's why the gap stays thin (4–6 px).
- **Pixel snapping:** tile edges are rounded to whole pixels after layout, so neighbouring tiles share exact edges and the export has no hairline seams.
- The layout is recomputed from `(items, canvas size)` in a `useMemo`. It's instant, so there's no fit-and-measure loop like Market Map's.

### Minimum tile size

With real valuations, the gap between the biggest and smallest companies can be 1,000× or more, so some tiles would end up only a few pixels wide. Maps have few companies, so every company keeps its own tile, and no tile gets less than a minimum area (`utils/minArea.ts`):

1. Each tile's target area is `value / total × canvas area`.
2. The minimum is `minTileSide²`: 180 px for Square and 190 px for Horizontal, so every tile has room for its logo and value.
3. Tiles below the minimum are pinned at it, and the rest of the area is shared between the other tiles by value. This repeats until no new tile falls below the line.
4. If the minimums alone would take more than half the canvas, the minimum is lowered so the large tiles still dominate.

Enlarged tiles are no longer to scale, so the sidebar says how many there are. The minimum guarantees area, not width: a small tile at the end of a row can be a little narrower than `minTileSide` (about 121 px in testing), which still leaves room for a logo and value.

## Responsive tiles

Each tile picks how much to show based on **its own pixel size**, not the canvas size. That's what keeps the design working at both canvas sizes and for any number of companies.

Every tile aims to show **logo, name and value**: stacked, or side by side on wide tiles.

- On small tiles the logo shrinks first, to make room for the two text lines.
- Text is only given up when the logo would fall below 32 px: the name first, then the value.
- With the minimum tile size this rarely happens. In testing with 12 companies, half of the Square tiles were held at the minimum (about 154 × 200 px), each with a 44–53 px logo, its name and its value.

- **Scaling:** logo size is the tile's short side × 0.34, kept between 44 and 160 px. The value's font size grows with the square root of the tile's area, kept between 20 and 56 px, and the name is 72% of that (at least 17 px). Big companies get visibly bigger type, and small ones stay legible.
- **Wide, short tiles** (width more than 2.2× height) place the logo to the left of the text instead of above it.
- **Names are measured before rendering.** `utils/measureText.ts` uses canvas `measureText` with the Outfit font, after `document.fonts.ready`. If a name doesn't fit on one line, it's truncated with an ellipsis. If the ellipsis would leave fewer than 4 characters, the name is dropped. Measuring this way avoids re-rendering the DOM to check sizes.
- **Tiles are absolutely positioned `<div>`s with `<img>` logos**, not SVG. The existing JPG export (`modern-screenshot` plus the image proxy) then works exactly as it does in the other tools.

## Canvas and design

- **Sizes:** **Square 1080 × 1080** (default) and **Horizontal 1920 × 1080**.
- **Frame:** the title and subtitle header at the top and "Presented by" in the corner, same as Market Map. The treemap fills the rest of the canvas.
- **Themes:** the shared theme list in `src/shared/canvas/themes.ts`: Dark and Light for now. The two placeholder themes from [auto-sizing-design-panel.md](auto-sizing-design-panel.md) are added there, and Bento picks them up automatically.
  - Tiles use `--canvas-card-bg` with a `--canvas-border` outline, and the gaps show `--canvas-bg`.
  - Each tile gets a light overlay of `--canvas-text` at 0–7% opacity, so tiles vary slightly in shade: lighter on Dark, darker on Light. The opacity is derived from the company name (`utils/tint.ts`), so a map looks the same every time it renders and in the export, and it doesn't encode anything.
  - The name sits in a pill with inverted colours for contrast: a `--canvas-text` fill with `--canvas-card-bg` text (a cream pill on Dark, an ink pill on Light). Its padding scales with the name's font size, and names are fitted to the width left inside the pill. The value is plain text in `--canvas-text-70` below it.
- **Logo contrast:** a dark logo on the Dark theme can disappear. Not built yet: logos sit directly on the tile, as in Top List. If it becomes a problem, add a per-theme logo chip.

## Sidebar

It uses the same shared **Design** panel as the other tools, without the spreadsheet switch because this sheet has no sizing values:

- **Size:** Square / Horizontal
- **Theme:** the theme selector
- **Show "Presented by":** a switch
- **Data:** the company count, skipped rows with reasons, duplicate names, and how many tiles are shown at minimum size
- **Import:** CSV/TSV file, Google Sheets URL, Load template, and Open template spreadsheet
- **Export:** Download JPG

There's no edit mode or drag and drop. Tile position comes from the value, and the spreadsheet is the source of truth. The title and subtitle are still editable on the canvas.

## Files

```
src/tools/bento-map/app/
  App.tsx                 state, import, export, canvas frame
  constants.ts            sizes and per-size presets
  components/
    BentoCanvas.tsx       lays out and renders the tiles
    BentoTile.tsx         picks a tier and renders logo/name/value
    Sidebar.tsx           Design panel, data summary, import/export
  utils/
    squarify.ts           treemap layout (pure)
    minArea.ts            proportional areas with a minimum tile size (pure)
    parseSheet.ts         header aliases, metadata rows, row validation
    value.ts              parses "4.2T" / "$1,200" → number; formats back to compact form
    tiers.ts              tile size → tier, logo size, font size
    measureText.ts        canvas-based text fitting
```

Also:

- a route in `src/router/index.tsx` with the `tool-bento-map` theme class
- a nav link in `Header.tsx`
- the title editor's rich-text CSS rules. These are currently duplicated per tool; move them to one shared class.

## Build order

1. The shared `src/shared/canvas/` pieces (sizes, themes, Design panel). This is step 1 of the auto-sizing plan; whichever plan is built first creates them.
2. `squarify.ts`, `value.ts` and `parseSheet.ts`, which are pure and testable on their own.
3. The canvas, tiles and tiers.
4. The sidebar, import/export and the template buttons.
5. Tuning the tier thresholds with real sheets: about 10, 40 and 120 companies, and a heavily skewed set.

## Decisions

1. **Sizes:** Square 1080 × 1080 (default) and Horizontal 1920 × 1080.
2. **Small companies:** keep their own tiles, with a minimum tile size.
3. **Tile text:** logo, name and value only. No share of the total.
4. **Grouping:** out of scope for now. An optional `group` column could add sector groups later without breaking three-column sheets.
