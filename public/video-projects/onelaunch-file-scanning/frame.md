---
version: 1
name: OneLaunch × Massive (video / frame layer)
description: >
  An animated Windows 11 screen recording in the style of the sparktray-campaign guide videos:
  full-bleed bloom wallpaper, taskbar with tray and clock, a cursor that clicks, and word-by-word
  subtitles above the taskbar. OneLaunch's own light UI (dock, Apps Library, Settings, the update
  dialog with Massive's consent) is drawn in its 1280×720 screen space and scaled 1.5×. The end
  card is OneLaunch × Massive in the campaign's endcard layout and Massive's colours.
unit: the frame, 1920×1080
principle: a real-looking screen recording · one action per moment, on its word · every claim from the pitch or the dialog
colors:
  bg: "#0a0a0f"
  red: "#d74939"
  red-light: "#ff8163"
  cream: "#faf4ec"
  cream-mid: "rgba(250, 244, 236, 0.75)"
  cream-dim: "rgba(250, 244, 236, 0.55)"
  win-blue: "#1F8FFF"
  win-green: "#1E9E63"
typography:
  subtitle: { fontFamily: "Inter", px: 46, weight: 700, lineHeight: 1.22, tracking: "-0.02em", stroke: "3px #000" }
  ui: { fontFamily: "Selawik", use: "OneLaunch's UI only, at the screenshots' own sizes" }
  end-headline: { fontFamily: "Outfit", px: 76, weight: 800, lineHeight: 0.98, tracking: "-0.04em" }
  end-body: { fontFamily: "Outfit", px: 27, weight: 400 }
components:
  subtitles: "One page per voice line at y 832–1002, words light from 42% to full as they're said, the word being said in {colors.red-light}. Always centred; it may pass over a notification in the corner."
  lockup: "OneLaunch's logo and name (Outfit 700) × Massive's logo (assets/brand/massive-logo-negative.svg). End card only."
  notification: "Windows' own spot: bottom right, 12px from the edge, just above the taskbar."
---

# OneLaunch × Massive: frame

## Overview

A user's screen, recorded: the dark Windows 11 bloom, OneLaunch's light dock across the top, and one action at a time, each
caused by the cursor and landing on a word of the narration. Subtitles carry the narration (two lines at most, Inter 700 46 px,
black outline, the word being said in Massive's red-light). The end card is the only branded frame.

- **Type:** Inter for subtitles and the Windows clock, Selawik (a Segoe UI stand-in) for OneLaunch's UI, Outfit on the end
  card. No mono: there's no code in this video.
- **Layout:** OneLaunch's panels and dialog stay above y 832. Notifications sit in Windows' own corner, above the taskbar;
  the subtitles stay centred and may pass over them.
- **No Avira, no Clearware:** the feature is unbranded File Reputation Scanning, and the only brands are OneLaunch × Massive.
- **Every claim comes from the pitch or the dialog's own text.** No revenue figures.

## Motion (sparktray-campaign rules)

- The camera never moves. Scenes cut on voice lines; the only fade is 4 frames up from black at the start.
- Cursor: 0.55 s travel, ease-out cubic, arriving on its word; a click ring grows 13 → 32 px over 0.3 s.
- Effects start after the click: panels and the dialog open over 0.45 s (opacity, scale 0.93/0.97 → 1), toasts slide 24 px
  in over 0.35 s, the switch flips in 0.22 s.
- The end card rises in over 0.85 s and then holds still: its last frame is the poster.

## Voice and copy

- Narration: ElevenLabs "Mark" (`v3p1kjzUvro6S76qmYmH`, `eleven_v3`, seed 20260806), via `npm run video:voice`, then
  `node timing.build.mjs` to move subtitles, clicks and cuts onto the real take.
- Plain, specific sentences. No em-dashes, no hashtags, no hype. Each voice line is one subtitle page (≤ about 17 words).
