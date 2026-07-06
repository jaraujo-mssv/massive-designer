import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { banners } from "./banners.config.mjs";
import { renderBannerFragment, BANNER_CSS } from "./template.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const outDir = resolve(repoRoot, "output", "banners");
await mkdir(outDir, { recursive: true });

// One HTML file containing all 5 banners in a side-by-side row, scaled to fit.
// Tweak SCALE below to zoom in/out.
const SCALE = 0.18;

const cards = banners
  .map(
    (b) => `
  <div class="card">
    <div class="card-head">
      <span class="card-layout">${b.image.toUpperCase()}</span>
      <span class="card-slug">${b.slug}</span>
    </div>
    <div class="thumb">
      ${renderBannerFragment(b)}
    </div>
  </div>`,
  )
  .join("");

const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Massive · Trade-Show Banners Preview</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    :root { --scale: ${SCALE}; }
    * { box-sizing: border-box; }
    html, body {
      margin: 0;
      background: #15151a;
      color: #faf4ec;
      font-family: 'Outfit', sans-serif;
      min-height: 100vh;
    }
    header {
      padding: 28px 40px 12px;
      display: flex;
      align-items: baseline;
      gap: 20px;
      border-bottom: 1px solid rgba(250, 244, 236, 0.08);
    }
    header h1 { font-size: 18px; font-weight: 600; letter-spacing: -0.01em; margin: 0; }
    header p { font-size: 13px; color: rgba(250, 244, 236, 0.55); margin: 0; }
    main {
      padding: 32px 40px 80px;
      display: flex;
      gap: 36px;
      align-items: flex-start;
      overflow-x: auto;
    }
    .card { display: flex; flex-direction: column; gap: 14px; flex-shrink: 0; }
    .card-head {
      display: flex;
      flex-direction: column;
      gap: 2px;
      font-size: 12px;
      color: rgba(250, 244, 236, 0.75);
    }
    .card-layout { font-weight: 600; letter-spacing: 0.08em; }
    .card-slug {
      font-family: 'JetBrains Mono', monospace;
      font-size: 11px;
      color: rgba(250, 244, 236, 0.45);
    }
    .thumb {
      width: calc(856mm * var(--scale));
      height: calc(2006mm * var(--scale));
      overflow: hidden;
      border-radius: 6px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      background: #0a0a0f;
    }
    /* Scale the banner-page down to thumbnail size. */
    .thumb .banner-page {
      transform: scale(var(--scale));
      transform-origin: top left;
    }

    /* ===== shared banner styles ===== */
    ${BANNER_CSS}
  </style>
</head>
<body>
  <header>
    <h1>Massive · Trade-Show Banners</h1>
    <p>5 designs · 85 × 200 cm · dark · with 3mm bleed & crop marks · scaled to ${(SCALE * 100).toFixed(0)}%</p>
  </header>
  <main>${cards}</main>
</body>
</html>`;

await writeFile(resolve(outDir, "preview.html"), html);
console.log(`  ✓ preview.html`);
console.log(`\nOpen: file://${resolve(outDir, "preview.html")}`);
