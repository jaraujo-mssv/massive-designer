# Content

**Status:** Implemented (2026-10-02) in `src/tools/content/`. Route `/content`. The first campaign is Massive Legends (`content/legends/`).

## What it's for

It organizes and previews campaign content before anything is shot: scripts, legend cards, the backstage photo shotlist, the landing page and the brief. It's adapted from the Content tab in sparktray-campaign. The explorer shell (a list, a reader, docs as markdown addressed by `?doc=`) came over; the previews are new, because Legends is live action rather than motion graphics.

## Content lives in markdown

- **Where:** `content/<campaign>/**/*.md`, at the repo root. The folder under `content/` is the campaign; the file name is the doc id.
- **Loading:** the tab bundles the files with `import.meta.glob` (`content.ts`). There's no index or codegen step: save a file and the tab hot-reloads.
- **Editing:** edit the files directly, by hand or with Claude.
- **Dev server writes:** on `npm run dev`, checklist boxes and the status pill are clickable and write back to the file (`contentWritePlugin` in `vite.config.ts`). The deployed site has no such endpoint, so there they're read-only.

### Frontmatter

| Kind | Fields |
|---|---|
| all | `title`, `kind` (`brief`, `script`, `legend`, `person`, `photos`, `page`), `status` (`draft`, `review`, `locked`, `done`, `blocked`, `archived`), optional `week` (rollout week) |
| brief | `tagline`, `signoff`, `url`, `goal`, used by every end card and the overview |
| script | `legends: [washington]`, `standards`, `format: vertical \| landscape`, `target` (seconds), `endCard` |
| legend | `short` (the name used in scripts), `look` (fixed appearance for video and image generation), `refs` (reference images), `then` (title in history), `role` (ambassador title), `trait`, `nod`, `standards`, `slides`, `earnedBy`, `trustBy`, `quote`, `endCard`, `link` |
| person | `short` (the name prompts use), `role`, `look`, `refs`. A real person who appears alongside the legends, like Massive's CEO; a photo includes them, with their description and reference images, whenever its prompt names them |
| place | `short` (its button name), `match` (phrases that put a photo there), `look`, `shot`, `aspect`, `refs`. A place the photos keep coming back to, like the press room or the office. Its first ref is an empty shot of it, attached to every photo whose prompt contains one of its `match` phrases (the longest wins), so the room looks the same from photo to photo |
| page | `url` |

Unknown kinds, statuses or formats don't break the tab. They show as amber warnings on the doc and on the overview.

### Body conventions

- **Checklists:** any `- [ ]` / `- [x]` line is a checklist item. Progress shows in the list, the overview and the doc. `## Checklist` holds a doc's production checklist.
- **Shots:** a script's `## Shots` holds one block per shot, headed `### Shot 1 · 6s`, where `6s` is the planned length. Each block is a list of fields:
  - `- **Visual:**` is what the outline describes.
  - `- **Camera:**` is framing, angle and movement, with where the move starts and ends.
  - `- **Action:**` is what happens over the shot, in order.
  - `- **Screen:**` is the exact on-screen text or UI, for shots that show a screen.
  - `- **Line:**` is the dialogue. `Name: "…"` is that person's line, and `Name, manner: "…"` adds how it's said. A bare `"…"` continues the previous speaker, or is the shot's legend when it opens the line. Unquoted text is a stage direction.
  - `- **Sound:**` is effects and ambience.
  - `- **Still:**` is an image path under `public/` that replaces the placeholder frame.
  - A shot whose visual starts with "End card" draws the end card.
- **Cast and sets:** a script's `## Cast` and `## Sets` list supporting characters and locations as `### Name` plus a paragraph: one fixed description, reused for every shot. Legends take theirs from `look:` in their own doc.
- **Look and feel:** the brief's `## Look and feel` is the style every shot shares.
- **Photos:** in the photos doc, `- [ ] **Washington:** …` under a `## Setting` heading puts a card in the legend × setting grid; items with no name are group shots. An indented `Prompt: …` line under an item is its image prompt, and an indented `Image: file.jpg` line is the finished photo, a file in `public/content/<campaign>/photos/`, shown at the top of its card. A campaign can have more than one photos doc, each with its own style: `photos.md` holds the candid backstage photos, `portraits.md` posed production portraits. `## Photo style` is the style every photo in that doc shares; a paragraph that opens `Indoors:` goes only into indoor photos, and one that opens `Outdoors:` only into photos set in a city. **Copy prompt** puts together the scene, the descriptions of everyone in it, the photo style, the format, and the reference images to attach with what each one is for. The images are numbered in the order they're attached, and each character's description names theirs ("Michael Jordan (image 4)"), so a model can tell whose face is whose. The scene wins over the style: a prompt that asks for a 135mm, deep focus or a posed photo gets it. Images follow Gemini 3 Pro Image's limits, at most 5 of people and 14 in all: everyone in frame gets their first (their portrait), then the photo's own character gets the rest of theirs, then the others get more in cast order; the official Massive logo (one for light surfaces, one for dark) comes after when the prompt mentions it. Branding is opt-in: only a scene that places the Massive logo (a backdrop, a banner, the reception wall, the billboard) is branded and gets the logo images, only one that says "Massive icon" (a lapel pin) gets the icon on its own (`massive-icon.png`, the mountain mark cropped from the logo), and only one that says "Massive T-shirt", "Massive tank top" or "Massive racerback" gets that "It's Massive" merch top (`massive-tee.jpg`, `massive-tank.jpg`, `massive-racerback.jpg`), which replaces the top in the wearer's description; every other prompt is told outright to show no Massive logo or name anywhere. Every prompt rules out other companies' brands, including on balls, hoops, sports gear, cars and devices. The copied prompt also states its location: the one city it names (Prague or San Francisco, found from the city and its landmarks), shown as itself, or no identifiable city for indoor shots. A card tags its city, and warns if a prompt names both. Under the prompt, one button per reference image (Portrait, Face, Full body, Logo light or dark, or another legend's name) copies that image itself to the clipboard as a PNG, to paste into the image tool.
- **Reference images:** a legend's `refs:` lists images in `public/content/<campaign>/refs/`, each as `{ file, use }`. The first one is the portrait on their card. "Copy for Flow" lists them for the video too.
- **Landing page blocks:** `<!-- block: hero | film | legends | quotes | toy | cost -->` in a landing page section draws that block live. `legends` and `quotes` read from the legend docs, and `toy` is the working pre-ticked-box gag.

## Using it

- **Overview** (no doc selected): tagline and goal, checklist progress, status counts, the rollout by week, open questions from the brief, and any file warnings.
- **Script:** has two views.
  - **Script** shows the cast and sets, every shot with its camera, action, screen, sound and lines, the total of the planned lengths against the target, the end card and the checklist. **Copy for Flow** copies the whole script as one plain-text brief to paste into ElevenLabs Flow: format and length, look and feel, cast and sets, every shot, and the end card copy.
  - **Animatic** shows each shot as a true-size frame (1080×1920 or 1920×1080) with burned-in captions, ending on the end card. Click a frame or **Full screen** to step through with ←/→. Export one PNG or all of them.
- **Legend:** the landing page card, the roster details, the scripts the legend appears in, and their backstage photos (tickable).
- **Photos:** the grid by setting and legend, group shots, and the production checklist.
- **Landing page:** a wireframe of every section at desktop or phone width, with live blocks.
- **Brief:** the brief as written, with its checklist.

## Generating photos

`npm run content:photos -- <campaign>` generates the campaign's photos through ElevenLabs' Image API, with GPT Image 2 by default, using the pipeline from fortuna-app. `--provider=google` sends them straight to Google's Nano Banana models (Gemini image) instead. It sends each photo the same prompt and reference images that **Copy prompt** builds, because it loads `photoPrompt.ts` and `content.ts` through Vite instead of keeping a copy.

- **Places first:** `npm run content:photos -- <campaign> --places` makes each place's reference image (an empty shot, sharp front to back, from its `shot` angle) and saves it as the place's first ref in `refs/`, skipping places that already have one. A photo set in a place whose image is missing is skipped until it exists. A place image can also be any image you drop in under that file name.
- **Which doc:** `photos.md` unless `--doc=<id>` names another, like `--doc=portraits`.
- **What it generates:** every photos item with a `Prompt:` and no `Image:`. `--force` redoes items that already have one, keeping the same file name. `--who="Michael Jordan"` limits the run to photos that person is in, and `--only=arrival-michael-jordan,group-selfie-rock` to the named photos. `--limit=N` caps the count.
- **Free checks:** `--print` shows each prompt, and `--dry-run` shows each request with the images shortened. Neither needs a key.
- **A real run:** prints the count, the model and the cost estimate, then asks before spending. `--yes` skips the question.
- **Model and size:** through ElevenLabs the default model is `gpt-image` (`gpt-image-2`), which takes up to 10 reference images. `--model=gemini-pro` (Nano Banana Pro), `gemini-flash`, `seedream` (Seedream 5 Pro, at most 2K) and `seedream-lite` pick others; the Seedream ones are ByteDance models, which ElevenLabs support has to enable for the account first. ElevenLabs bills in plan credits, so the run shows no dollar estimate. With `--provider=google` the default is `pro` (`gemini-3-pro-image`, about $0.14 an image), and `--model=flash` (about $0.04) and `--model=lite` are cheaper. Size is `2K` unless `--size` names another the model takes (`1K`, or `4K` on Google and the Gemini and GPT models). Up to 3 photos generate at once (`--concurrency`).
- **Aspect ratio:** `3:2`, or `3:4` when the prompt says vertical. A model with no preset for the ratio gets the nearest one, so Seedream makes landscape photos 4:3 (ElevenLabs' API doesn't take a size in pixels).
- **Output:**
  - The photo is saved to `public/content/<campaign>/photos/<setting>-<owner>.jpg`. The setting is the first word of the `##` heading that isn't a filler word, so "With the crew" becomes `crew` and "Around the city" becomes `city`. The owner comes from `**Name:**`. A group shot takes two words from its label, for example `group-selfie-rock`.
  - The reference images go in the order the prompt numbers them. Google's API also takes a label right before each image ("Image 4: Michael Jordan, face"); ElevenLabs' takes images only, so the prompt's own list of images is what ties each number to a face. A photo with a reference file missing is skipped, since the numbers would no longer match.
  - The prompt sent, with those labels, is saved to `content/<campaign>/prompts/<name>.txt`.
  - The item gains an `Image:` line and is ticked, so the Content tab shows the photo straight away.
- **Refusals:** a prompt the model refuses is listed at the end, with a command to retry just those photos.
- **Key:** `ELEVENLABS_API_KEY`, or `GOOGLE_AI_API_KEY` (or `GEMINI_API_KEY`) with `--provider=google`, from the environment or from a `.env` file at the repo root. `.env` is gitignored; see `.env.example`.
- **Single images:** `scripts/content/lib/elevenlabs-image.mjs` and `scripts/content/lib/nanobanana.mjs` also run on their own, for example `--prompt-file p.txt --ref face.jpg --aspect 3:2 --out x.jpg`.

## Adding a campaign

Make a folder under `content/` with a `brief.md` (its `title` names the campaign) and docs of the kinds above. With more than one campaign, a picker appears above the list.

## Files

```
content/<campaign>/            the markdown
public/content/<campaign>/refs/  reference images (legends, people, places, official Massive logo on light and dark)
public/content/<campaign>/photos/  finished photos
src/tools/content/app/
  App.tsx                      URL state (?doc, ?c, ?view), sidebar layout
  content.ts                   import.meta.glob → campaigns
  constants.ts, types.ts
  utils/parseDoc.ts            frontmatter (yaml), sections, per-kind fields, warnings
  utils/shots.ts               shot blocks, Line parsing, cast/sets entries, timing
  utils/flowBrief.ts           a script as one brief for ElevenLabs Flow
  utils/photoPrompt.ts         a backstage photo's full prompt and reference images
  utils/checklist.ts           task-list items with their file lines
  utils/export.ts              frame → PNG (modern-screenshot, saveFile)
  hooks/useContentWrite.ts     dev-server writes (checkbox, status)
  components/
    DocList.tsx                search, kind/legend/status filters, grouped list
    DocPane.tsx                header, warnings, the reader for each kind
    CampaignOverview.tsx       overview
    ScriptView.tsx             cast, sets and shots
    AnimaticBoard.tsx          frames, export, full-screen viewer
    frames.tsx                 ShotFrame, EndCardFrame (artwork, real px)
    FrameBox.tsx               true-size frame scaled for display
    LegendCard.tsx, LegendView.tsx, PersonView.tsx, PlaceView.tsx, PhotoGrid.tsx
    PagePreview.tsx, ConsentToy.tsx
    Checklist.tsx, Markdown.tsx, pills.tsx
vite.config.ts                 contentWritePlugin (dev only)
scripts/content/photos.mjs     npm run content:photos: batch photo generation
scripts/content/lib/elevenlabs-image.mjs  ElevenLabs Image API (GPT Image, Gemini, Seedream), the default
scripts/content/lib/nanobanana.mjs  Gemini image API (Nano Banana), ported from fortuna-app
scripts/content/lib/env.mjs    the repo-root .env loader and ImageError, shared by both
```
