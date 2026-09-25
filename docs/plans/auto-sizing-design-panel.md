# Plan: automatic sizing with one design panel

**Tools:** Market Map, Top List
**Status:** Planned. Open questions below need answers before implementation starts.

## Problem

People who build a spreadsheet for Top List or Market Map often include values for every sizing parameter (`__SETTING__…` rows). Users rarely want to tune these by hand, and the ~25 sliders spread across 5–6 sidebar tabs confuse more than they help.

## Goal

- Sizing is **automatic by default**.
- A switch applies the spreadsheet's own values when someone wants them.
- **One panel** controls the design: size, theme, and that switch.

## What changes for the user

The sidebar tabs go away (Layout, Sections, Section Header, Companies, Title, Rows, Settings) and so do their sliders. They're replaced by one **Design** panel:

- **Size:** `850 × 1100` (default) or `1920 × 1080`
- **Theme:** Light, Dark, and two new placeholder themes
- **Use spreadsheet values:** a switch, off by default. It's greyed out when the loaded sheet has no sizing values.
- **Show "Presented by":** stays as a switch. It isn't a sizing setting.

Import (file, URL, embed code), Export (JPG, TSV) and Edit/Preview stay as they are. Editing on the canvas stays too: dragging items, adding companies, editing logos, and editing the title text.

## How "automatic" works

Each tool gets a **starting preset for each size**, so portrait and landscape layouts each start from sensible values. The tool then fits the content into the canvas.

### Market Map

1. Start from the preset for the chosen size.
2. **Columns:** chosen automatically with the existing column-balancing logic (`autoAdjustColumns`). It's capped by width: up to 3 columns at 850 wide, up to 5 at 1920. The sheet's `__COLUMNS__` value is ignored.
3. **Fit:** the existing Auto Fit (shrinks to fit), then Auto Gaps (spreads items to fill the height). They run automatically instead of from buttons.

### Top List

1. Start from the preset for the chosen size.
2. **Columns:** based on the number of companies and the canvas shape. For example, portrait uses 1 column up to about 12 companies, then 2. Landscape uses 2–4.
3. **Fit (new):** scale logo size, fonts, row padding and gaps up or down until the rows fill the canvas height. "Fill column height" is on by default.

### When it re-runs

After data loads, when the size changes, and after items are added, removed or moved (with a short delay). The fitting process renders the page about a dozen times to measure it, so the canvas shows a brief "Fitting…" overlay instead of visibly jumping.

## The spreadsheet switch

- The sheet's `__SETTING__` values are always read and stored, but only applied when the switch is on. Turning it off goes back to automatic.
- With the switch on, the sheet also controls size and theme if it includes them, and the selectors update to match. They can still be changed afterwards.
- TSV export still writes every setting, so the round trip still works.
- **Embeds (`?f=`)** default to automatic. Adding `&s=1` makes an embed use the sheet's values.

## Themes

Light and dark are currently hard-coded in a few places. For example, the export picks `bg.jpg` or `bg-light.jpg` directly, and Market Map card borders check for `'light'`. Move themes into **one shared list** (id, label, CSS class, background image) that every canvas tool reads. Add two placeholder themes with rough colours to tune later. Suggested names: **"Signal"** (brand-red background, cream text) and **"Paper"** (white background, black text, no background image).

## Code structure

- **New `src/shared/canvas/`** (also used by Bento Map, see [bento-map.md](bento-map.md)):
  - `sizes.ts`: the size presets
  - `themes.ts`: the theme list
  - `DesignPanel.tsx`: the panel UI
  - `useAutoFit.ts`: the fitting search, taken out of Market Map so Top List can use it too
- **Each tool gets one `utils/parseSheet.ts`** that replaces the 2–3 copies of the import code. The switch logic then lives in one place. This also fixes the bug where Top List drops valuations on file import.
- **`Settings` is split in two:**
  - what the user chooses: size, theme, the switch, Presented by
  - the computed sizing values, from the automatic presets or from the sheet
- **Removed:** the tab UI in both `EditControls.tsx` files, the Auto Fit / Auto Gaps / Auto-Adjust Columns buttons, the per-card "Item Gap" slider in Market Map, and "Restore Defaults".
- **CSS:** two new theme classes in `src/styles/theme-canvas.css`.

## Build order

1. Shared pieces: `src/shared/canvas/`
2. Top List (the simpler tool)
3. Market Map

## Open questions

1. **Market Map default size.** Should 850×1100 be the default there too? Market Map defaults to 1920×1080 today, and market maps are usually landscape. Recommendation: 850×1100 for Top List, 1920×1080 for Market Map, with both sizes available in each tool.
2. **Top List "Thumbnail" layout.** It has its own tab of 11 sliders and is hard-coded to 1200×675, so it gets clipped at both sizes. Recommendation: remove it. The alternative is to keep it and give it automatic values.
3. **Theme names.** Are "Signal" and "Paper" fine as placeholders?
