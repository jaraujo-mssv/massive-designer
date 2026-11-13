---
name: massive-print
description: Make, edit or render a Massive print piece or designed PDF in this repo. Use when the user asks for a poster, flyer, one-pager, handout, leaflet, business card, table tent, name badge, sign, certificate, event menu, document or white paper as a PDF, an A4/A5/A3/letter or custom-size sheet, a trade-show roll-up banner, or merch (buttons, pins, stickers, T-shirts, bucket hats, hip packs, pajamas). Not for slide decks (massive-deck) or social images (massive-image). Covers the print pipeline (scripts/print), the older docs, one-pager and menu pipelines, roll-up banners, merch, rendering and where files go.
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
| Buttons, pins, stickers, T-shirts, tote bags, mugs, water bottles, bucket hats, hip packs, promo cards, pajamas | `scripts/merch/merch.html` | `npm run merch` | `public/merch-files/` (committed) |
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
stickers (`stickers/*.svg`). The T-shirt is Printful's Comfort Colors 1717 in Black, Terracotta or White: a 12 × 16 in
file for the front (the halftone sticker without its backing, `tees/*.svg`) and the back, each the whole print area
on a transparent ground. The tote bags, the mug and the water bottle are Printful's too, each file the whole print area:
the mug with the white halftone sticker placed on it (`.on-sticker`), the totes and the bottle with the world map in
orange outline (`world/world-outline.svg`) over "Access the [Massive] network" and joinmassive.com (`.on-access`; the
black tote's logo has cream letters): a tote's file is the strip it's sewn from, the back upside
down below the front; the mug and bottle files wrap round, and their mockups bend the print round the cylinder (the
`.cyl` script at the end of the page). The bucket hat (embroidered or printed) and the hip pack come from Rush Order Tees,
who place the art themselves: each file is the logo alone, 3.5 in wide, on a transparent ground, the mountain one orange
(#F38165) and the letters white, as thread and screen ink can't do the gradient. The Prague Crawl wooden glass (Etsy) is laser engraved in one colour:
its files are black art on a transparent ground, from the event's wordmark flattened to one colour and NodeMaven's
logo, both in `scripts/merch/glass/`, and its mockups wrap the engraving round the glass. The pajamas are made on Printful too: two 1 × 1 m seamless prints (the logo's mountain, and
the sleepy mountains in `pajamas/sleepy/`), each on the dark ground (White trim) and on white (Black trim), laid out
on a lattice by the script at the end of the page, with front flats of Printful's seven garments. That script also
makes their proof pages. A design's `data-dpi` sets its PNG's resolution (the prints are 150 dpi). Read the page
before changing a design. `npm run merch` writes the PDFs, PNGs and SVGs to `public/merch-files/` (and the sidebar's 160 px previews to its
`thumbs/`, `scripts/merch/thumbs.mjs`), which the live
Merch tab serves, so commit them. `npm run merch:printful` then cuts the prints into Printful's print files, one per
placement of each garment (listed in `src/tools/merch/app/printful.ts`), in `output/printful/`, not committed.
`npm run merch:mockups` makes desk photos through ElevenLabs and costs credits: run it only when asked.
The promo card (A6, for Reads) is two designs that share a `data-print`: `npm run merch -- card` renders just those and
writes the file to upload, a two-page CMYK PDF with trim and bleed boxes (`scripts/merch/cmyk-pdf.mjs`, on a Mac, for its
CMYK profile). After any change to the back, test the QR on that PDF. The cabinet card (A6 flat, A7 folded) works the same way:
`npm run merch -- card-cabinet`, with its baked panels in `scripts/merch/cards/cabinet/`. So does the tri-fold brochure (A4
flat, DL folded, three equal panels): `npm run merch -- brochure`, with its panels in `scripts/merch/cards/brochure/`.

## Workflow

1. Get the brief: what the piece is for, its size (and bleed, if it's going to a printer), the copy, and any images.
   Ask for whatever is missing. Don't make up copy.
2. `npm run print:new <slug> "<Title>" -- --size=…`, or `--from=` the closest existing piece.
3. Write the copy into the HTML, using the classes above.
4. `npm run print <slug>`. Look at `output/print/<slug>.png`. For more than one page, read the PDF and check every
   page. Fix any mono warning, and anything that overflows or crowds the edges.
5. Report the PDF path and what you checked. Don't open files for the user unless they ask.
