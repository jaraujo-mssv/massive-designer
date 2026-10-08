---
title: "Backstage test: celebrity guests"
kind: brief
status: draft
date: 2026-10-05
owner: José
goal: Check that the backstage photo pipeline holds up with characters other than the four legends.
---

## Abstract

An internal test of the backstage photo pipeline, not a campaign. It uses the same shot list structure as the Legends backstage photos, but the cast is Jason Grad, Massive's CEO, hosting four real celebrities, The Rock, John Cena, Michael Jordan and Sydney Sweeney. Nothing here is for publishing.

## Cast

- **Jason Grad**: Massive's CEO and host, with a front, three-quarter and profile sheet as his main face reference.
- **The Rock**: visiting celebrity, dark suit and open collar.
- **John Cena**: visiting celebrity, navy suit and tie.
- **Michael Jordan**: visiting celebrity, light grey suit over a black sweater.
- **Sydney Sweeney**: visiting celebrity, cream blazer and wide-leg trousers.

`references.md` holds prompts for clean reference sheets of everyone: a face turnaround and a full-length photo in their outfit.

## What we're checking

- Likeness: do the reference images and descriptions hold each face, build and outfit across photos, including group shots with everyone?
- Model acceptance: does the image model take prompts that name real celebrities, or refuse them or weaken the likeness?
- Location: one city per photo, Prague or San Francisco, and nothing identifiable indoors.
- Branding: the Massive logo appears only where the scene places it, and no other brand appears.
