---
name: massive-image
description: Make, edit or render a Massive static image in this repo's Images tool (HTML image projects under public/image-projects). Use when the user asks for a static image, still, social image, post graphic, card, banner, or a still version of a video for the Images tab, or wants an image turned into a reusable template. Covers the project format, editable fields, the Massive house style, rendering to JPG, and where files go.
---

# Massive image

Static images in this repo are **one HTML page per image**. They're listed in the Images tab (`/images`), where
anyone can edit their fields and download a JPG, and rendered locally with Playwright. They build up into a library
of references and templates, so write each one to be reused: clean markup, the house tokens, and real fields.

## Where things live

- `public/image-projects/<id>/`: one project per image.
  - `index.html`: the page. The image is `#canvas` at its exact size.
  - `meta.json`: catalogue entry and fields (see below).
  - `assets/`: photos, backgrounds and icons the page uses, referenced by relative path. Tracked and deployed.
  - `thumb.jpg`: written by `image:render`, shown in the Library.
- `public/image-projects/_brand/`: `massive.css` (tokens, fonts, reset, `#canvas` base, `.m-dotgrid`, `.m-bg-dark`), the
  shared logos (`logo-massive.svg`, `icon-massive.svg`, `icon-massive-white.svg`, `linkedin.svg`, `linkedin-in.png`) and
  backgrounds: `bg-dark.jpg` (the Market Map dark canvas), `bg-network-map.webp` (the old site's network map, edges
  faded to transparent) and `bg-globe.jpg` (Earth at night; darken it under type). Link them as `../_brand/…`.
  `jason-15k-network` shows all of them plus the world map behind one `bg` select field.
- `public/image-projects/_lib/`:
  - `image-kit.js`: field binding. Every page includes it, as its last script.
  - `confetti.js`: `massiveConfetti(layer, { mode: "burst" | "cannons", count, at, x, y })`, the video confetti frozen at one moment.
  - `world-paths.js`: `WORLD_PATHS` (country outlines as `[iso, pathData]`) on a `WORLD_MAP.w × WORLD_MAP.h` Mercator canvas,
    from massive-new-landing. Fill them with `Path2D` for maps; `jason-15k-network` draws them as a background.
- `public/image-projects/index.json`: the tab's catalogue. **Regenerate with `npm run image:index` after any change.**
- `output/images/<id>.jpg`: renders (gitignored).

## Commands

| Command | Does |
|---|---|
| `npm run image:new <id> "<Title>" [--format=portrait\|square\|landscape\|vertical\|x]` | Scaffold a blank project (1080×1350, 1080×1080, 1920×1080, 1080×1920, 1200×675) |
| `npm run image:new <id> "<Title>" --from=<id>` | Start from an existing project (page, assets, fields) |
| `npm run image:render <id…> \| --all` | Render to `output/images/<id>.jpg` at 2× and refresh `thumb.jpg` |
| `npm run image:render <id> --fields '<json>' --name <out>` | Render with overridden fields (no thumb change) |
| `npm run image:index` | Rebuild `index.json` for the tab |

## meta.json

```json
{
  "id": "jason-15k-grid",
  "title": "Jason 15K: Grid",
  "description": "One line on what it is; shown under the fields.",
  "group": "massive",
  "series": "Jason 15K",
  "status": "draft",
  "tags": ["jason", "linkedin", "milestone"],
  "source": "video-projects/jason-15k-grid",
  "width": 1080,
  "height": 1350,
  "fields": [
    { "id": "name", "label": "Name", "type": "text", "default": "Jason Grad" },
    { "id": "photo", "label": "Photo", "type": "image", "default": "assets/jason.jpg" },
    { "id": "confetti", "label": "Confetti", "type": "toggle", "default": true }
  ]
}
```

- `group`: `"massive"` for a finished, one-off image; `"templates"` for one meant to be filled in again (a speaker card,
  a hire announcement). A template's defaults should read as a good example, not as placeholder text.
- `series` groups related images in the Library (all the stills of one campaign, say).
- `width` and `height` must match `#canvas`.

## Fields

Fields are the editable parts. **`meta.json`'s defaults are the source of truth**: image-kit applies them on load.
Still write the same text into the markup, so the page reads correctly in an editor. Bind them in markup:

- `data-field="name"` sets the element's text. Several elements can share one field (`15K` in a headline and a chip).
- `data-field-src="photo"` sets an `<img>` src. Image defaults are paths relative to the page; uploads arrive as data URLs.
- `data-field-show="confetti"` hides the element when the toggle is off.
- **Select** fields (`"type": "select"`, `"options": [{ "value": "map", "label": "World map" }, …]`) pass the chosen
  `value` to the page; switch layouts with it in `onFields` (e.g. set `#canvas[data-shape]` and key CSS off it).
- **Derived visuals**: anything computed from values, such as a canvas drawing or a fitted layout, goes in
  `window.onFields = async (values) => { … }`. It runs after every update, after fonts and images have loaded.
  See `jason-15k-network`, which draws the dotted number from the `short` field.

Make a field of anything someone would plausibly change: names, roles, numbers, headlines, photos, optional
decoration. Leave structure and brand marks fixed. Use CSS `text-transform` for case, not the field's value.

## House style

Use the video house style; see `public/video-projects/_brand/frame.md`. The tokens are in `_brand/massive.css`:
- **Colors:** ground `#0a0a0f`, cream `#faf4ec`, red `#d74939`, red-deep `#b8321f`, red-light `#ff8163`.
- **Fonts:** Outfit (100–900) for type and JetBrains Mono (400/600/700) for labels.
- **Patterns:** 900-weight display type with tight negative tracking, mono uppercase eyebrows and labels, the dot grid
  or a line grid, and red corner brackets.

A still of an existing video should be its final frame, held: copy the composition's CSS and set each element to where
its timeline leaves it. Drop anything that only exists in motion (glows that fade out, shockwaves). Where a moment
reads better than the end state, freeze it; confetti is the usual one. Pick its `at` and origin so it frames the type
and doesn't cover it.

## Export rules

The tab exports in the browser with modern-screenshot; `image:render` uses Playwright. Both must match, so:
- **Don't use `backdrop-filter`**: it doesn't come through the export. Use a solid rgba fill.
- Give `#canvas` its own background color (light pages included). The tab exports with that color as the JPG's ground;
  it only falls back to `#0a0a0f` when the canvas is transparent.
- Load fonts and images only through `massive.css` and local `assets/`. No other remote URLs, so nothing taints or misses the export.
- Draw canvases at 2× (`width`/`height` attributes double the CSS size, plus `setTransform(2,0,0,2,0,0)`).

## Workflow

1. `npm run image:new <id> "<Title>"` (or `--from=` a close existing image, or port from a video project).
2. Write `index.html` and `meta.json`, copying any assets into `assets/`.
3. `npm run image:render <id>` and **look at `output/images/<id>.jpg`**. Compare it against the source if there is one
   (a video's `snapshots/`). Iterate.
4. `npm run image:index`, then check it in `/images`: edit a field, then Download JPG.
