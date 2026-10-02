# Massive Designer

A collection of internal design tools for creating polished visual assets — market maps, social media posts, top lists, and image exports. Built with React + Vite, deployable to Vercel.

## Tools

### Market Map Generator
Create industry landscape maps with categorized company cards. Supports drag-and-drop reordering, CSV/TSV import (including Google Sheets), per-card color coding, grid or list view, and PNG export.

### Social Media Post Designer
Design social media graphics with customizable layouts and typography.

### Top List Generator
Build ranked list visuals for reports and presentations.

### Content
Organizes and previews campaign content (scripts, animatic frames, legend cards, photo shotlists, landing page wireframes) from markdown under `content/`. On the dev server, checklists and status write back to the files. See `docs/plans/content.md`.

### Logo Encoder
Turns an image into a square PNG data URL (base64), ready for the `logo` column of Top List and Market Map sheets.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Build & Deploy

```bash
npm run build
```

The project includes a `vercel.json` config for SPA routing — deploy directly to Vercel with no additional setup.

## Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS v4
- Radix UI
- React DnD
- `modern-screenshot` for PNG export
