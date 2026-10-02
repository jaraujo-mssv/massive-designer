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
| legend | `short` (the name used in scripts), `look` (fixed appearance for video and image generation), `refs` (reference images), `role`, `trait`, `nod`, `standards`, `slides`, `earnedBy`, `trustBy`, `quote`, `endCard`, `link` |
| person | `short` (the name prompts use), `role`, `look`, `refs`. A real person who appears alongside the legends, like Massive's CEO; a photo includes them, with their description and reference images, whenever its prompt names them |
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
- **Photos:** in the photos doc, `- [ ] **Washington:** …` under a `## Setting` heading puts a card in the legend × setting grid; items with no name are group shots. An indented `Prompt: …` line under an item is its image prompt, and an indented `Image: file.jpg` line is the finished photo, a file in `public/content/<campaign>/photos/`, shown at the top of its card. `## Photo style` is the style every photo shares. **Copy prompt** puts together the scene, the descriptions of the legends in it, the photo style, the format, and the reference images to attach with what each one is for. The photo's own legend gets all their images; anyone else in frame gets their portrait only, plus the official Massive logo (one for light surfaces, one for dark) when the prompt mentions it. Branding is opt-in: only a scene that places the Massive logo (a backdrop, a banner, the reception wall, the billboard) is branded and gets the logo images; every other prompt is told outright to show no Massive logo or name anywhere. The copied prompt also states its location: the one city it names (Prague or San Francisco, found from the city and its landmarks), or no identifiable city for indoor shots. A card tags its city, and warns if a prompt names both. Under the prompt, one button per reference image (Portrait, Face, Full body, Logo light or dark, or another legend's name) copies that image itself to the clipboard as a PNG, to paste into the image tool.
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

## Adding a campaign

Make a folder under `content/` with a `brief.md` (its `title` names the campaign) and docs of the kinds above. With more than one campaign, a picker appears above the list.

## Files

```
content/<campaign>/            the markdown
public/content/<campaign>/refs/  reference images (legends, official Massive logo on light and dark)
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
    LegendCard.tsx, LegendView.tsx, PersonView.tsx, PhotoGrid.tsx
    PagePreview.tsx, ConsentToy.tsx
    Checklist.tsx, Markdown.tsx, pills.tsx
vite.config.ts                 contentWritePlugin (dev only)
```
