---
title: Reference sheets
kind: photos
status: draft
---

Clean reference images for everyone in the test, to replace the mixed press and event photos their references are now: a face turnaround (front, three-quarter and profile) and a full-length photo in the outfit their description gives them. Once a sheet looks right, it becomes that person's reference: the turnaround as their first image, `<name>-turnaround.webp`, and the full-length one as `<name>-full.webp`. Internal only, not for publishing.

Each item has a prompt for image generation. "Copy prompt" in the Content tab adds their description, the photo style below and their current reference images to attach. `npm run content:photos -- backstage-test --doc=references` generates them all.

## Photo style

Clean studio reference photography for a casting file, against a seamless mid-grey backdrop. A large, soft, even light from the front with gentle fill: no dramatic shadows, rim light or coloured light. Full-frame camera at f/8 so everything is sharp, 85mm for faces and 50mm for full length. True-to-life skin tones and colours, a neutral grade, no grain or filters. Photorealistic: a real person photographed plainly, with no retouching that changes their features. Nothing else in the frame: no props, furniture, text or labels.

## Face turnarounds

- [x] **Jason Grad:** Front, three-quarter and profile
  Prompt: A face reference sheet of Jason Grad, Massive's CEO: three head-and-shoulders portraits side by side and evenly spaced. Left: facing the camera straight on. Middle: a three-quarter view turned to his left. Right: a true side profile facing left, the whole profile line from forehead to chin sharp. The same relaxed expression with a closed-mouth half-smile in all three, in his black T-shirt, his hair neat and in place. He must be unmistakably the same person in all three views.
  Image: face-jason-grad.webp
- [x] **The Rock:** Front, three-quarter and profile
  Prompt: A face reference sheet of The Rock: three head-and-shoulders portraits side by side and evenly spaced. Left: facing the camera straight on. Middle: a three-quarter view turned to his left. Right: a true side profile facing left, the whole profile line from forehead to chin sharp. The same relaxed expression with the mouth closed in all three, in his white shirt open at the collar, the edge of his chest tattoo just visible. He must be unmistakably the same person in all three views.
  Image: face-the-rock.webp
- [x] **John Cena:** Front, three-quarter and profile
  Prompt: A face reference sheet of John Cena: three head-and-shoulders portraits side by side and evenly spaced. Left: facing the camera straight on. Middle: a three-quarter view turned to his left. Right: a true side profile facing left, the whole profile line from forehead to chin sharp. The same relaxed expression with a small closed-mouth smile in all three, in his light-blue shirt and dark red striped tie. He must be unmistakably the same person in all three views.
  Image: face-john-cena.webp
- [x] **Michael Jordan:** Front, three-quarter and profile
  Prompt: A face reference sheet of Michael Jordan: three head-and-shoulders portraits side by side and evenly spaced. Left: facing the camera straight on. Middle: a three-quarter view turned to his left. Right: a true side profile facing left, the whole profile line from forehead to chin sharp, his earring visible in the profile. The same relaxed expression with the mouth closed in all three, in his black fine-knit sweater. He must be unmistakably the same person in all three views.
  Image: face-michael-jordan.webp
- [x] **Sydney Sweeney:** Front, three-quarter and profile
  Prompt: A face reference sheet of Sydney Sweeney: three head-and-shoulders portraits side by side and evenly spaced. Left: facing the camera straight on. Middle: a three-quarter view turned to her left. Right: a true side profile facing left, the whole profile line from forehead to chin sharp, her hair tucked behind her ear on that side. The same relaxed expression with a closed-mouth half-smile in all three, in her white camisole. She must be unmistakably the same person in all three views.
  Image: face-sydney-sweeney.webp

## Full body

- [x] **Jason Grad:** Full length in his black T-shirt and trousers
  Prompt: A vertical full-length reference photo of Jason Grad, Massive's CEO, standing relaxed, head to toe with a little space above his head and below his feet, his body turned slightly toward his left and his face to the camera, arms loose at his sides, a relaxed half-smile. In his plain black T-shirt and black trousers exactly as described, with plain black low-top sneakers. Shot from chest height so his proportions stay true.
  Image: full-jason-grad.webp
- [x] **The Rock:** Full length in his dark suit
  Prompt: A vertical full-length reference photo of The Rock standing relaxed, head to toe with a little space above his head and below his feet, his body turned slightly toward his left and his face to the camera, arms loose at his sides, a relaxed expression. In his dark suit over a white shirt open at the collar and thin gold chain exactly as described, with black leather dress shoes. Shot from chest height so his size and proportions stay true.
  Image: full-the-rock.webp
- [x] **John Cena:** Full length in his navy suit and tie
  Prompt: A vertical full-length reference photo of John Cena standing relaxed, head to toe with a little space above his head and below his feet, his body turned slightly toward his left and his face to the camera, arms loose at his sides, a small closed-mouth smile. In his navy suit, light-blue shirt and dark red striped tie exactly as described, with brown leather oxford shoes. Shot from chest height so his proportions stay true.
  Image: full-john-cena.webp
- [x] **Michael Jordan:** Full length in his light grey suit
  Prompt: A vertical full-length reference photo of Michael Jordan standing relaxed, head to toe with a little space above his head and below his feet, his body turned slightly toward his left and his face to the camera, arms loose at his sides, a relaxed expression. In his light grey suit over a black fine-knit sweater exactly as described, with black leather loafers. Shot from chest height so his height and long limbs stay true.
  Image: full-michael-jordan.webp
- [x] **Sydney Sweeney:** Full length in her cream suit
  Prompt: A vertical full-length reference photo of Sydney Sweeney standing relaxed, head to toe with a little space above her head and below her feet, her body turned slightly toward her left and her face to the camera, arms loose at her sides, a relaxed half-smile. In her fitted cream blazer, white silk camisole, cream wide-leg trousers, small gold hoops and nude block heels exactly as described. Shot from chest height so her petite proportions stay true.
  Image: full-sydney-sweeney.webp

## Checklist

- [x] Each sheet checked against the real person before it replaces their references
- [x] Turnarounds saved as `<name>-turnaround.webp` and full-length photos as `<name>-full.webp` in refs, first in each person's `refs:`
