# Massive brand assets

Where each logo, background and font lives, and when to use it. Use the files; never redraw or recolour them. The
rules for using them are in [BRAND.md](BRAND.md).

Each pipeline reads its own copy, because each one renders from its own folder: an image project can't reach
`public/logo.svg` from a video project, and a HyperFrames project only sees its own folder.

## Logos

| Ground | Images (`public/image-projects/_brand/`) | Videos, GIFs (`assets/brand/` in each project) | Decks | App, other |
|---|---|---|---|---|
| Dark | `logo-massive.svg` (white wordmark, gradient mark) | `logo-white.svg` (all white) | `scripts/deck/_assets/logo.svg` | `public/logo.svg`, `public/logo-negative.svg` |
| Dark, glow scenes | | `logo-positive-white.png` | | |
| Light | `logo-massive-positive.svg` (ink wordmark) | `logo-positive.svg` | | `public/logo-positive.svg` |
| Mark only, dark | `icon-massive.svg` (gradient) or `icon-massive-white.svg` | | | |

- A video project gets the shared files from `public/video-projects/_brand/assets/brand/` when it's created, or when
  you run `npm run video:brand <id>`.
- Merch draws the logo from the SVG sprite inside `scripts/merch/merch.html`.
- `scripts/deck/_assets/prague-crawl/` holds the Prague Crawl event's own versions.

## Backgrounds and textures

| File | What | Used by |
|---|---|---|
| `public/image-projects/_brand/bg-dark.jpg` (= `public/bg.jpg`) | Near-black, a faint large grid and a red glow at the bottom | Dark images (`<img class="m-bg-dark">`), Market Map and Top List Dark export |
| `public/image-projects/_brand/bg-globe.jpg` | Dark globe | One image |
| `public/image-projects/_brand/bg-network-map.webp` | Dark network map | One image |
| `public/bg-light.jpg`, `public/canvas-bg-light.jpg` | Cream canvas grounds | Legacy: canvas Light themes only |
| `public/image-projects/_brand/brush.svg` | Red brush stroke behind one word | Hiring images |
| `scripts/banners/_assets/world-map.svg` | World map, from the landing site | Roll-up banners |
| `.m-dotgrid`, `.m-linegrid` | The dot grid (dark) and line grid (light), in CSS | Images, videos, GIFs |

## Fonts

- **Outfit** and **JetBrains Mono** load from Google Fonts: the image CSS imports them, and each video's `index.html`
  links them. Renders need a network connection.
- **Caveat** (handwriting): `public/image-projects/_brand/fonts/Caveat.ttf` (OFL). The `writers-hiring-*` images
  carry their own copy.

## Other

- **Flags:** `public/image-projects/_brand/flags/<country-code>.svg` (see the `LICENSE.txt` there).
- **LinkedIn icon:** `public/image-projects/_brand/linkedin.svg`, `linkedin-in.png`.
- **Partner and customer logos and screenshots:** put them in the project. That's `assets/` in an image project,
  and `assets/brand/` in a video or GIF project, because the rest of a video's `assets/` is gitignored.
