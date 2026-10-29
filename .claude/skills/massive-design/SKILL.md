---
name: massive-design
description: The front door for any Massive design request. Use it first whenever someone asks to design, make, create, draft, mock up, resize, update or export anything visual for Massive (a post, image, graphic, carousel, thumbnail, banner, GIF, animation, video, deck, slides, poster, flyer, one-pager, PDF, card, sign, merch, market map or ranking), or isn't sure which tool to use. Routes the request to the right pipeline and skill, collects the brief, and covers checking, handing over and sharing the work.
---

# Designing for Massive

The person asking may not be an engineer. Talk in plain language, run the commands yourself, and show them the
result. Every design follows `brand/BRAND.md`.

## 1. Route the request

| They want | Family | Read this skill | Start with | They get |
|---|---|---|---|---|
| A post image, LinkedIn carousel, link preview (OG), YouTube thumbnail, LinkedIn cover, web banner, email header, profile or hiring card | Still | `massive-image` | `npm run image:new <id> "<Title>" -- --format=… [--light]` | `output/images/<id>.jpg` (carousels: a PDF) |
| A LinkedIn GIF, a looping post graphic, a still design with a few moving parts | Motion | `massive-gif` | `npm run gif:new <id> "<Title>"` | `public/video-projects/<id>/gif/` |
| A video, explainer, teaser, social clip, anything with a voiceover | Motion | `massive-video` | `npm run video:new <id> "<Title>"` | `output/video/<id>.mp4` |
| A deck, slides, a pitch or sponsorship presentation, a PowerPoint | Slides | `massive-deck` | copy the closest deck in `scripts/deck/` | `output/deck/<slug>.pdf`, `.pptx` |
| A poster, flyer, one-pager, handout, business card, sign, badge, menu, document PDF | Print & PDF | `massive-print` | `npm run print:new <slug> "<Title>" -- --size=…` | `output/print/<slug>.pdf` |
| A trade-show roll-up banner | Print & PDF | `massive-print` (Roll-up banners) | edit `scripts/banners/banners.config.mjs`, then `npm run banners:html` | `output/banners/<slug>.pdf` |
| Buttons, pins, stickers, pajamas | Print & PDF | `massive-print` (Merch) | edit `scripts/merch/merch.html`, then `npm run merch` | `public/merch-files/` |
| A market map or a top-N ranking from a spreadsheet | No code | none | Market Map or Top List at https://massive-designer.vercel.app/ (or `npm run dev`, then `/market-map` or `/top-list`) | a JPG download |
| A partnership announcement image, or a logo as a data URL | No code | none | the app's Partnership Post or Logo Encoder | a download |

**Words that could mean two things:**
- **"Banner":** a web or email banner is a still. A trade-show roll-up is print.
- **"Carousel":** a LinkedIn document carousel is a series of portrait stills joined into a PDF. A video "carousel" is
  video. Ask if it's unclear.
- **"Animated" or "moving":** a looping post graphic with no sound is a GIF. Anything with narration, music or a story
  over time is a video.
- **"One-pager" or "PDF":** print, unless it's slides.

Nothing fits? Pick the family by what they'll get: pixels for a screen are a still, pages are print. Say which one
you chose.

Then **read that family's skill before doing anything else**. It has the format, commands and rules for the family.

## 2. Get the brief

Ask once, in one message, only for what's missing:
- **Where it goes:** the channel or use (LinkedIn post, website, a printed poster). That sets the size;
  `brand/BRAND.md` has "Sizes by channel".
- **The copy:** the exact headline and text, or a source file to take it from. Never invent numbers, dates, prices or
  claims. If a figure has no source, leave a visible placeholder and say so.
- **The look:** dark (the default) or light. Any assets: photos, partner logos, screenshots.
- **More than one size?** Make the main one first, then derive the others from it.

## 3. Start from what exists

Look for the closest existing design, and start from it rather than from blank:
- Stills: `public/image-projects/index.json` (title, category, series, template). Templates have `"group": "templates"`.
  `image:new --from=<id>` copies one.
- Videos and GIFs: `public/video-projects/index.json`.
- Decks: `scripts/deck/*.html`. Print: `scripts/print/*.html` (`print:new --from=<slug>`).

## 4. Make it, then check it yourself

1. Build it as the family's skill says. Keep to its folder: `public/image-projects/<id>/`,
   `public/video-projects/<id>/`, `scripts/deck/`, `scripts/print/`. Don't change `src/`, `package.json`, the shared
   `_brand/` files or other people's projects unless they asked for that.
2. Render it, then **look at the output** (read the JPG, PNG or PDF). Check it against `brand/BRAND.md`:
   - one register and one accent;
   - Outfit everywhere, mono only for code;
   - the right logo for the ground;
   - nothing crowding the edges, and type readable on a phone;
   - no invented numbers.
3. Fix what's off and render again.
4. Run `npm run design:mono -- <page>` for anything that isn't already checked on render.
5. Tell them where the file is (the full path) and what you checked. Offer the next step: other sizes, edits, or
   sharing it.

**Before you run anything that costs money, ask.** `npm run video:voice` (ElevenLabs credits), `npm run merch:mockups`
and `npm run content:photos` all cost money. Say what it costs first.

**If a command fails because something isn't installed,** run `npm run doctor`. Then `npm run setup` fixes what it
can; tell them the steps it can't do (like `brew install ffmpeg`).

## 5. Share it (only when they ask)

Renders in `output/` stay on their machine; they post or send the file themselves. To add the design itself to the
shared library, open a pull request for the repo owner to review:
1. Start from the latest master: `git switch master && git pull --ff-only`, then `git switch -c design/<id>`.
2. Rebuild the index for the family: `npm run image:index` or `npm run video:index`.
3. Add only this design's files, by path: the project folder with its assets (a video's voiceover and music
   included), and the index. Never `git add -A`.
4. `git commit -m "design(<family>): <title>"`, then `git push -u origin design/<id>`, then
   `gh pr create --base master --fill`. Say what it is and what you checked in the description.
5. Give them the PR link. Never commit to or push `master`, and never force-push.

If the index file conflicts with someone else's PR, regenerate it instead of merging it by hand.
