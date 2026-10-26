---
name: massive-print
description: Make, edit or render a Massive print piece or designed PDF in this repo. Use when the user asks for a poster, flyer, one-pager, handout, leaflet, business card, table tent, name badge, sign, certificate, event menu, document or white paper as a PDF, an A4/A5/A3/letter or custom-size sheet, a trade-show roll-up banner, or merch (buttons, pins, stickers). Not for slide decks (massive-deck) or social images (massive-image). Covers the print pipeline (scripts/print), the older docs, one-pager and menu pipelines, roll-up banners, merch, rendering and where files go.
---

# Massive print

Anything printed, or a designed PDF that isn't a deck. New pieces go through **`scripts/print/`**: one HTML file per
piece, sized by its own `@page`, rendered to PDF by Playwright Chromium. The brand rules are in `brand/BRAND.md`;
read it first.

## Which pipeline

| Request | Pipeline | Command | Output |
|---|---|---|---|
| Poster, flyer, one-pager, handout, card, sign, badge, menu, certificate: any new piece, any size | `scripts/print/<slug>.html` | `npm run print:new`, `npm run print` | `output/print/<slug>.pdf` + `.png` |
| A new multi-page document or white paper | `scripts/print/`, several `.page`s | same | same |
| The existing docs (`blocked-destinations`, `best-practices`) | `scripts/docs/` (cream, legacy) | `npm run docs` | `output/docs/<slug>.pdf` |
| The compliance one-pager | `scripts/onepager/` (cream, legacy) | `npm run onepager` | `output/onepager/` |
| The Jaipur dinner menu | `scripts/menu/` (cream, legacy) | `npm run menu` | `output/menu/` |
| Trade-show roll-up banners, 85 × 200 cm | `scripts/banners/` | `npm run banners:html`, `npm run banners` | `output/banners/<slug>.pdf` |
| Buttons, pins, stickers | `scripts/merch/merch.html` | `npm run merch` | `public/merch-files/` (committed) |
| Slides | the `massive-deck` skill | | |

Edit the legacy docs, one-pager and menu in place when asked, but start new pieces in `scripts/print/`, even one that
looks like them. Their render scripts list their files by hand, and they're on the cream ground the brand no longer
uses.

## Commands

| Command | Does |
|---|---|
| `npm run print:new <slug> "<Title>" -- --size=A4\|A5\|A3\|A2\|letter\|<W>x<H>mm [--landscape] [--from=<slug>]` | Write `scripts/print/<slug>.html` from the template (A4 by default), or copy another piece (`--from`), resized when `--size` is given |
| `npm run print <slug…>` | Render to `output/print/<slug>.pdf` and a PNG of page 1; with no slug, every piece. Also takes a path to any HTML file |

## The piece

- **One file:** `scripts/print/<slug>.html` links `print.css` and sets its size in `<style id="page-size">`:
  `@page { size: W H }` and `--page-w`, `--page-h` and `--s` on `:root`. `--s` scales all type and spacing with the
  page (1 on A4, 1.41 on A3, 0.7 on A5), so a template looks the same at any size. To resize, re-run `print:new`
  with `--from` and `--size`, or edit the three values together.
- **One `.page` per printed page.** It's a flex column, so a `.grow` spacer pushes the footer to the bottom. Use
  `.page.white` for a plain white page.
- **Classes in `print.css`:**
  - Type: `.eyebrow`, `h1`, `h2`, `.lede`, `p`, `.label`, `.hl` (accent text), `strong`.
  - Numbers: `.stat` plus a `.source` line. Every figure needs a source.
  - Blocks: `ul.bullets`, `.cols` (set `--cols` for more than 2), `.card`, `.rule`, `.footer` (logo + `.url`).
  - `code` for real code only.

  Reuse these before writing new CSS. One-off styles go in the piece's own `<style>`.
- **Assets:** the logo is `../../public/logo-positive.svg`. Put a piece's photos and partner logos in
  `scripts/print/_assets/<slug>/`.
- **Bleed:** if the printer asks for it (usually 3 mm), add it to each side of `--page-w`, `--page-h` and `@page`, and
  keep text inside `--pad`. Say in your report that you did.

## House style for print

`brand/BRAND.md`, light register: white cards on the faint orange ground, ink type, one paper-red accent, the line
grid, Outfit everywhere (mono only for code). One statement per page; a poster is a headline, one image or stat, and
the footer. Copy comes from the brief or a source file: never invent numbers, dates or claims.

## Roll-up banners

`scripts/banners/banners.config.mjs` holds the five 85 × 200 cm banners (slug, headline, sub, URL, the background
glow, and an `image` key that picks a composition from `compositions.mjs`). Edit the copy there, run
`npm run banners:html` to preview in the browser, then `npm run banners` for the print PDFs (856 × 2006 mm with
bleed). A new composition goes in `compositions.mjs`; `scripts/banners/_assets/` holds the world map.

## Merch

`scripts/merch/merch.html` is the artwork and the print proof (Letter landscape, actual size, with guides). Its header
comment has each vendor's spec: the 1" button, the 1" printed pin, the 1.25" soft-enamel pin and the 10 × 5 cm
stickers (`stickers/*.svg`). Read it before changing a design. `npm run merch` writes the PDFs, PNGs and SVGs to
`public/merch-files/`, which the live Merch tab serves, so commit them. `npm run merch:mockups` makes desk photos
through ElevenLabs and costs credits: run it only when asked.

## Workflow

1. Get the brief: what the piece is for, its size (and bleed, if it's going to a printer), the copy, and any images.
   Ask for whatever is missing. Don't make up copy.
2. `npm run print:new <slug> "<Title>" -- --size=…`, or `--from=` the closest existing piece.
3. Write the copy into the HTML, using the classes above.
4. `npm run print <slug>`. Look at `output/print/<slug>.png`. For more than one page, read the PDF and check every
   page. Fix any mono warning, and anything that overflows or crowds the edges.
5. Report the PDF path and what you checked. Don't open files for the user unless they ask.
