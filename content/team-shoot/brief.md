---
title: Team photoshoot
kind: brief
status: draft
date: 2026-11-13
owner: José
goal: Complete the team's studio portraits, generating the teammates who missed the shoot so they match the real photos.
---

## Abstract

Massive's team had a studio photoshoot: a seamless white backdrop, bright high-key light, everyone in the same black Massive T-shirt, standing or on a black stool. Eight teammates were photographed on the day. This campaign generates the ones who weren't there, from an ordinary photo of each, so the whole team reads as one shoot.

## How it works

- `photos.md` holds the photo style and one item per teammate. Its `style:` images, two real photos from the day, go with every request, so the model copies the backdrop, light and framing. It takes nothing of who is in them.
- Each teammate has a doc in `people/` with a description and their own photo, the only source for their likeness.
- "Black Massive T-shirt" in a prompt attaches `massive-shoot-tee.webp`, a crop of the real shirt, so the print comes out right.
- `npm run content:photos -- team-shoot --who="Name"` generates one teammate (GPT Image 2 through ElevenLabs by default).
- More takes of a teammate: `npm run content:photos -- team-shoot --take --who="Name"` adds take 2, 3 and so on (`studio-<name>-take-<n>.webp`), listed on the item's `Takes:` line. The Content tab shows the takes on the card; click one to pick it. `Image:` is the take picked, and its profile picture comes with it.
- Every new photo also gets a square profile picture, framed like the team's own crops of the real shoot (head and shoulders, the face centred, 1080 px), in `public/content/team-shoot/profiles/<photo>.jpg`. `profiles: true` in `photos.md` turns this on. `--profiles` remakes the crops of photos already made.

## What we check

- Likeness: the generated photo is clearly the teammate in their own photo.
- One shoot: backdrop, light, framing and grade match the real eight side by side.
- The shirt: MASSIVE reads correctly, in the halftone print over the orange mountains, and no other logo or brand appears.
- Sign-off: each teammate sees their photo and okays it before it's used anywhere.
