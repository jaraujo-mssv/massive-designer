---
version: 1
name: Massive — Frame (video / frame layer)
description: >
  Massive's house style for HyperFrames videos, taken from the designer's tokens
  (src/styles/theme-base.css) and the ported brand videos. Dark register by default:
  near-black ground, cream type, one red accent. The cream register is for editorial
  carousels (the AEO set). Outfit carries every text role; JetBrains Mono is chrome only.
unit: the frame — 1920×1080 primary; 1080×1080 and 1080×1920 documented
principle: one accent · type does the work · every number comes from the script
colors:
  bg: "#0a0a0f"
  surface: "#121117"
  card: "#1a1920"
  red: "#d74939"
  red-light: "#ff8163"
  cream: "#faf4ec"
  cream-mid: "rgba(250, 244, 236, 0.75)"
  cream-dim: "rgba(250, 244, 236, 0.55)"
  border: "rgba(250, 244, 236, 0.08)"
  dot: "rgba(96, 118, 145, 0.7)"
  paper: "#f1ead8"
  ink: "#171615"
  paper-red: "#d54635"
  paper-red-light: "#f3a07a"
  paper-grid: "rgba(23, 22, 21, 0.045)"
typography:
  display: { fontFamily: "Outfit", px: 148, weight: 900, lineHeight: 1.0, tracking: "-0.04em" }
  h1: { fontFamily: "Outfit", px: 96, weight: 900, lineHeight: 1.05, tracking: "-0.04em" }
  h2: { fontFamily: "Outfit", px: 80, weight: 700, lineHeight: 1.05, tracking: "-0.04em" }
  h3: { fontFamily: "Outfit", px: 54, weight: 300, lineHeight: 1.1, tracking: "-0.02em" }
  lead: { fontFamily: "Outfit", px: 36, weight: 400, lineHeight: 1.3 }
  body: { fontFamily: "Outfit", px: 26, weight: 400, lineHeight: 1.4 }
  stat: { fontFamily: "Outfit", px: 360, weight: 900, lineHeight: 0.86, tracking: "-0.05em" }
  eyebrow: { fontFamily: "JetBrains Mono", px: 14, weight: 600, tracking: "0.08em", upper: true }
  label: { fontFamily: "JetBrains Mono", px: 16, weight: 600, tracking: "0.08em", upper: true }
  code: { fontFamily: "JetBrains Mono", px: 25, weight: 400, lineHeight: 1.6 }
spacing:
  pad-x: "100px"
  pad-y: "96px"
  gap-lg: "44px"
  gap-md: "30px"
  gap-sm: "14px"
components:
  registers:
    dark: "ground {colors.bg}, text {colors.cream}, secondary {colors.cream-dim}, accent {colors.red} / {colors.red-light}"
    cream: "ground {colors.paper}, text {colors.ink}, accent {colors.paper-red}, decoration {colors.paper-red-light} at 25% opacity"
    description: "One register per video. Dark is the default; cream is for editorial stat carousels."
  dot-grid:
    background: "radial-gradient(circle, {colors.dot} 1.5px, transparent 1.5px) at 72px, opacity 0.18"
    description: "The dark register's ground texture. Paper register uses a 60px 1px line grid in {colors.paper-grid}."
  brackets:
    color: "{colors.red}"
    size: "44px arms, 3px thick, 52px from each corner"
    description: "Corner brackets frame content scenes; they grow in over the first 12 frames. Not on logo or outro frames."
  eyebrow:
    typography: "{typography.eyebrow}"
    color: "{colors.red}"
    marker: "24×1px {colors.red} rule before the text"
    description: "Scene kicker, e.g. USE CASE 01."
  wordmark:
    typography: "{typography.display}"
    fill: "linear-gradient(135deg, {colors.red}, {colors.red-light}) clipped to text, drop-shadow 0 0 60px {colors.red} at 27%"
    description: "Reserved for the product name moment."
  card:
    background: "{colors.card}"
    border: "1px solid {colors.red} at 27%"
    radius: "20px"
    padding: "32px 40px"
  logo:
    file: "assets/brand/logo-massive.svg (outro) · assets/brand/icon-massive-white.svg (menu bar) · assets/brand/logo-positive-white.png (glow scenes)"
    height: "68–72px on logo frames"
    description: "Logo opens and closes branded videos; outro pairs it with joinmassive.com in {typography.label}."
---

# Massive — Frame

## Overview

Massive's videos explain infrastructure to builders, so they read like a confident technical
brief: **near-black ground, cream type, one red accent**, and a lot of air. Outfit carries
every text role, and weight does the talking: 900 for the line that matters, 300–400 for
everything around it. JetBrains Mono is the only other face and appears as chrome (eyebrows,
URLs, labels, terminal output), always uppercase and tracked when it's a label.

**Key characteristics:**

- **One accent.** Red `#d74939` for marks and emphasis, `#ff8163` for highlights and glows. Never a second hue.
- **Type as the hero.** One display moment per frame; everything else steps down clearly.
- **Quiet texture.** Dot grid (dark) or line grid (cream) under everything; corner brackets on content frames.
- **Numbers come from the script.** Stats, dates and claims are never invented for a frame.

## The Frame

- **Primary:** 1920×1080. **Square:** 1080×1080 (LinkedIn carousels, 80px padding). **Vertical:** 1080×1920.
- **Safe area:** 100px sides, 96px top/bottom on 16:9.
- **Density:** one statement per frame; bullets capped at three; declarative frames stay at least half empty.

## Motion

- Content rises in: 36px slide-up on a spring (damping 22, stiffness 200) with an 8-frame fade.
- Hero words scale in from 0.72 on a softer spring (damping 20, stiffness 160).
- Statements wipe in left to right (clip-path, 16 frames); brackets and rules grow rather than fade.
- Stagger lines by 10–14 frames; scenes cut, they don't cross-dissolve, except in the cream carousel (24-frame blur fade).

## Voice and copy

- Narration: ElevenLabs "Mark" (`v3p1kjzUvro6S76qmYmH`, `eleven_v3`, stability 0.55, similarity 0.75, seed 20260806).
- Plain, specific sentences. No em-dashes in spoken lines, no hashtags, no hype words. Audio tags like `[thoughtful]` live only in SCRIPT.md.
- On-screen copy says the claim; narration explains it. Don't read the screen aloud.

## Do / Don't

- **Do** end branded videos on the logo and `joinmassive.com`.
- **Do** keep claims scoped exactly as the source states them.
- **Don't** add a second accent color, gradients beyond the wordmark, or drop shadows on cards.
- **Don't** use stock "AI" imagery (robots, glowing brains); diagrams and product UI carry the story.
