---
name: massive-deck
description: Make, edit or export a Massive slide deck in this repo's deck pipeline (HTML decks under scripts/deck). Use when the user asks for a deck, presentation, slides, pitch or sponsorship deck, or a PDF or PowerPoint (.pptx) of one, or to change an existing deck. Covers the HTML slide format, the Massive and event styles, rendering to PDF and PNG, the editable PowerPoint export and its limits, and where files go.
---

# Massive deck

Decks in this repo are **one HTML file per deck**, each slide a `<section class="slide">` at exactly 1920×1080. Both
outputs come from that HTML: Playwright prints it to PDF, and `pptx.mjs` rebuilds every slide from the live page as
native PowerPoint objects (text boxes, shapes, pictures). The PPTX is **not** made from the PDF, so its text stays
editable. Write the HTML for both: it's the source of truth, and the PDF and PPTX are disposable renders.

## Where things live

- `scripts/deck/<slug>.html`: one deck. The slug is the file name; every `.html` here is a deck.
  - `consent-sourcing-v2.html`: the Massive look (dark, Outfit, red). Start here for a Massive deck.
  - `prague-crawl-2027.html`: an event's own look (Inter + Jersey 25, photo backdrops). Start here for an event or partner deck.
  - `consent-sourcing.html`: v1 of the consent deck, kept for reference.
- `scripts/deck/deck.css`: the Massive deck system (tokens, slide frame, footer, components).
- `scripts/deck/mockups.css`: product UI rebuilt as static HTML/SVG (`.m-win`, `.m-inst`, `.m-apps`, `.m-console`,
  `.m-phone`, `.m-chart`…). Kept at the originals' pixel sizes; scale them on the slide with `zoom` so they stay vector.
- `scripts/deck/prague-crawl.css`: the Prague Crawl look. The model for any deck with its own look.
- `scripts/deck/_assets/`: images and logos, referenced relatively (`_assets/logo.svg`). A deck with its own look keeps
  its assets in `_assets/<slug>/`.
- `output/deck/<slug>.pdf`, `<slug>.pptx` and `<slug>/NN.png`: renders (gitignored).

## Commands

| Command | Does |
|---|---|
| `npm run deck <slug…>` | Print each deck to `output/deck/<slug>.pdf` |
| `npm run deck <slug> -- --png` | Also write one PNG per slide to `output/deck/<slug>/NN.png`, for review |
| `npm run deck` | Print every deck |
| `npm run deck:pptx <slug…>` | Build the editable `output/deck/<slug>.pptx` |

Flags need the `--` so npm passes them through. Fonts load from Google Fonts, so rendering needs a network connection.

## Deck format

```html
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=1920">
<title>How compliant residential proxy sourcing works — Massive</title>
<link rel="stylesheet" href="deck.css">
</head>
<body>

<!-- ======================================================================
     1 · Title
     ====================================================================== -->
<section class="slide title-slide cover" data-sec="" data-nofoot>…</section>

<!-- ======================================================================
     2 · Hook
     ====================================================================== -->
<section class="slide" data-sec="Why this matters">…</section>
…
<script>/* icons and footer, see below */</script>
</body>
</html>
```

- `<title>`: the text before " — " becomes the PowerPoint's title.
- `data-sec="Section"`: groups slides into PowerPoint sections. Give every slide one: a slide without it (or with it
  empty) goes into "Cover" if it's the first slide and "Close" otherwise. The Prague deck has none, so its PPTX is one
  Cover slide followed by a "Close" section.
- `data-hidden`: keeps a slide in the source but leaves it out of the PDF, PNGs, PPTX and the numbering.
- `data-nofoot`: no footer on that slide (covers and closes).
- Number the slide comments (`1 · Title`) so slides are easy to find and talk about.
- The Massive look stamps its footer (logo and page number) and its icons with the script at the end of
  `consent-sourcing-v2.html`. Copy it whole: `<i data-i="checkSquare"></i>` becomes a Lucide line icon, and the icon
  set lives in its `P` map (add a Lucide path there for a new one). The Prague deck writes its page numbers by hand
  (`<div class="foot"><span class="num">02</span></div>`) instead.

A stylesheet for a new look must keep the print frame from `deck.css`, or the PDF breaks:

```css
@page { size: 1920px 1080px; margin: 0; }
html, body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.slide { position: relative; width: 1920px; height: 1080px; margin: 0 auto 40px; overflow: hidden; break-after: page; }
.slide:last-of-type { break-after: auto; }
.slide[data-hidden] { display: none; }
@media print { .slide { margin: 0; } }
```

(`prague-crawl.css` is missing the `data-hidden` rule, so a hidden slide there still prints to the PDF.)

## House style (the Massive look)

`brand/BRAND.md` is the brand guide; `deck.css` mirrors the landing site's dark theme on top of it:
- **Tokens:** `--bg #0a0a0f`, `--text #faf4ec` (with `--text-mid` and `--text-dim`), `--red #d74939`,
  `--red-light #ff8163`, `--green #8be9a1`, `--surface #121117`, `--border`. `--green` (the `.good` card) is a second
  hue the brand guide lists as legacy: in a new deck, mark what's good with red-light or a tick instead.
- **Type:** Outfit (300–800) for everything, labels included; there's no monospace in this deck. If a slide shows
  real code (a command, a config block), that code alone may be mono (CLAUDE.md rule 4); never labels or numbers.
- **Frame:** slide padding `104px 128px 140px`, a red glow top-left over a 48px line grid, and the footer at the bottom.
- **Components:** `.eyebrow`, `.hl` (red-light highlight), `.lede`, `.source` (citations); layouts `.body`/`.col`,
  `.slide.split` (`.text` + `.visual`); `.card` (`.bad` red top rule, `.good` green, `.ghost` dotted outline),
  `.rows`/`.row` (numbered list), `.ticks` (`.q`, `.x`), `.stat`, `.tag`, `.callout`, `.timeline`/`.era`, `.mirror`,
  `.quote`, `.title-slide`, `.slide.close` (`.close-text` + `.close-links`).

Reuse these before writing new CSS. One-off tweaks go in a `style` attribute on the slide; anything used twice goes in
the stylesheet.

**A different look** (an event, a partner): write `<slug>.css` modelled on `prague-crawl.css`. Take its colours and
type from the brand's own material, keep the print frame above, and put the assets in `_assets/<slug>/`.

Copy: plain, specific sentences. Never invent numbers; cite every figure with `.source` (or the look's own note style).

## PowerPoint export rules

`pptx.mjs` walks each slide in paint order and turns what the browser drew into:
- **Text boxes**: every run keeps its font, colour, size, letter-spacing, italic and underline, with the browser's line
  breaks. A box holding just one line of text (a `.tag`, a `.callout`) becomes one shape with its text inside.
- **Shapes and lines**: background colours and borders (solid, dashed, dotted), with rounded corners.
- **Pictures**, each separate, movable and replaceable: `img`, inline `svg` (kept as SVG, so it can be recoloured), any
  `m-*` mockup, any element with a `background-image` (gradients and gradient text included) and absolutely positioned
  `::before` bullets. **The whole element becomes one picture, children and text included.**
- **The backdrop**: the slide's own background becomes one flat picture. A slide with `url()` backgrounds gets the
  photo and the gradient shade as two pictures instead.
- **The chart**: `.m-chart` is rebuilt as a native line chart, but it's wired to the consent deck's chart (series
  "Blocked", a `%` axis, the `.plot`/`.y span`/`.x` markup). For a new chart, adapt `chartOf` and the `addChart` call,
  or let it come through as a picture by not using `.m-chart`.

So, when writing slides:
- Keep words as real DOM text, outside SVGs, canvases and background-image boxes, or they won't be editable.
- Wrap something in an `m-` class when it should stay one picture (product UI, a diagram with labels).
- Bold is weight 600 and up; **300 and 500 come out as regular**. Don't build a hierarchy on light vs medium.
- The first font in each `font-family` stack is the one PowerPoint asks for. Fonts are referenced, not embedded: Google
  Slides has them all; Keynote and PowerPoint need them installed.
- Translucent text is flattened to a solid colour, cards lose their `box-shadow` (pictures keep theirs) and transforms
  such as rotation aren't carried over.
- Keep everything inside the 1920×1080 frame: pictures are clipped to it.

## Workflow

1. Copy the closest deck to `scripts/deck/<slug>.html` (`consent-sourcing-v2` for the Massive look, `prague-crawl-2027`
   plus a new `<slug>.css` for an event look) and cut it down to a cover, the slides needed and a close.
2. Write the slides, reusing the components above. Put new assets in `_assets/` (or `_assets/<slug>/`).
3. `npm run deck <slug> -- --png` and **look at every `output/deck/<slug>/NN.png`**: overflow, collisions, footer,
   numbering. Iterate.
4. `npm run deck:pptx <slug>`. The log counts the text boxes, shapes and pictures; a text-heavy deck with few text
   boxes has text trapped in pictures. To see the PPTX itself, convert it with LibreOffice into a scratch folder and
   compare it with the PNGs:
   `soffice --headless --convert-to pdf --outdir <scratch> output/deck/<slug>.pptx`, then
   `pdftoppm -png -r 40 <scratch>/<slug>.pdf <scratch>/pptx`.
5. Report the paths of the PDF and PPTX. **Don't `open` them.**
