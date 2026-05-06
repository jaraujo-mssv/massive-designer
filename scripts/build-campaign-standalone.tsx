import { renderToStaticMarkup } from 'react-dom/server';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ARTICLE_TEMPLATES } from '../src/tools/campaign-designer/app/components/templates/articles/articleTemplates';
import type { Platform } from '../src/tools/campaign-designer/app/types';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT = path.join(ROOT, 'dist-campaign-standalone');

// 1. Reset output dir
fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// 2. Copy referenced static assets
fs.cpSync(path.join(ROOT, 'public', 'logo.svg'), path.join(OUT, 'logo.svg'));
fs.cpSync(path.join(ROOT, 'public', 'web-render-api'), path.join(OUT, 'web-render-api'), { recursive: true });

// 3. Render each (template, platform) to static markup
const PLATFORMS: { id: Platform; label: string; w: number; h: number; scale: number }[] = [
  { id: 'linkedin',         label: 'LinkedIn',                            w: 1080, h: 1080, scale: 0.32 },
  { id: 'twitter',          label: 'X / Twitter Post and Blog Post',      w: 1200, h: 675,  scale: 0.4  },
  { id: 'twitter-article',  label: 'X / Twitter Article and Email Header', w: 1244, h: 500,  scale: 0.4  },
];

// Rewrite absolute image paths (e.g. src="/logo.svg") to relative for file:// usage
function relativizePaths(html: string): string {
  return html.replace(/src="\//g, 'src="./');
}

const sections = ARTICLE_TEMPLATES.map((tpl) => {
  const canvases = PLATFORMS.map((p) => {
    const inner = relativizePaths(renderToStaticMarkup(<tpl.Component content={tpl.content} platform={p.id} />));
    return `
      <div class="canvas-wrap">
        <div class="canvas-label">${p.label}<br/>${p.w}×${p.h}</div>
        <div class="canvas-frame" style="width:${p.w * p.scale}px;height:${p.h * p.scale}px;">
          <div class="canvas-scale" style="width:${p.w}px;height:${p.h}px;transform:scale(${p.scale});">
            ${inner}
          </div>
        </div>
      </div>
    `;
  }).join('');

  return `
    <section class="template-section">
      <h2 class="template-name">${tpl.name}</h2>
      <div class="canvas-row">${canvases}</div>
    </section>
  `;
}).join('');

// 4. Wrap in HTML scaffold
const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Campaign Designer · Templates</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    background: #1a1928;
    color: #faf4ec;
    font-family: 'Outfit', sans-serif;
    padding: 56px 40px 96px;
    min-height: 100vh;
  }
  .page-header {
    max-width: 1300px;
    margin: 0 auto 48px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(250,244,236,0.08);
  }
  .page-header h1 {
    font-size: 24px;
    font-weight: 700;
    margin: 0;
  }
  .page-header p {
    margin: 8px 0 0;
    font-family: 'JetBrains Mono', monospace;
    font-size: 12px;
    color: rgba(250,244,236,0.4);
  }
  .template-section {
    max-width: 1300px;
    margin: 0 auto 56px;
    padding: 28px 32px;
    border: 1px solid rgba(250,244,236,0.06);
    border-radius: 16px;
    background: rgba(250,244,236,0.02);
  }
  .template-name {
    margin: 0 0 24px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    font-weight: 600;
    color: rgba(250,244,236,0.5);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  .canvas-row {
    display: flex;
    flex-wrap: wrap;
    gap: 32px;
    justify-content: center;
    align-items: flex-start;
  }
  .canvas-wrap {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }
  .canvas-label {
    font-family: 'JetBrains Mono', monospace;
    font-size: 11px;
    color: rgba(250,244,236,0.3);
    letter-spacing: 0.04em;
    text-align: center;
    line-height: 1.4;
  }
  .canvas-frame {
    overflow: hidden;
    border-radius: 8px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    flex-shrink: 0;
  }
  .canvas-scale {
    transform-origin: top left;
  }
</style>
</head>
<body>
  <header class="page-header">
    <h1>Campaign Designer · Templates</h1>
    <p>Web Render API Launch · Static visual preview</p>
  </header>
  ${sections}
</body>
</html>`;

fs.writeFileSync(path.join(OUT, 'index.html'), html);
console.log(`✓ Wrote ${path.relative(ROOT, OUT)}/index.html`);
console.log(`  Open: file://${path.join(OUT, 'index.html')}`);
