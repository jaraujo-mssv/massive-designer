// Scaffold a new Massive HyperFrames project in public/video-projects/<id>.
//
//   node scripts/video/new.mjs <id> "<title>" [--format=landscape|square|vertical]
//
// Writes hyperframes.json, meta.json, frame.md (the Massive house style), an
// index.html host with the house fonts and CSS, a STORYBOARD.md stub and an empty
// media.json, then syncs lib/ and assets/brand/ in.
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { BRAND_DIR, PROJECTS_DIR, ROOT } from './lib/projects.mjs';

const FORMATS = { landscape: [1920, 1080], square: [1080, 1080], vertical: [1080, 1920] };

const args = process.argv.slice(2);
const [id, title] = args.filter((a) => !a.startsWith('--'));
const format = args.find((a) => a.startsWith('--format='))?.split('=')[1] ?? 'landscape';
if (!id || !title || !/^[a-z0-9][a-z0-9-]*$/.test(id) || !FORMATS[format]) {
  console.error('Usage: npm run video:new <kebab-id> "<Title>" [--format=landscape|square|vertical]');
  process.exit(1);
}
const dir = join(PROJECTS_DIR, id);
if (existsSync(dir)) {
  console.error(`public/video-projects/${id} already exists.`);
  process.exit(1);
}
const [w, h] = FORMATS[format];

mkdirSync(join(dir, 'compositions'), { recursive: true });
writeFileSync(
  join(dir, 'hyperframes.json'),
  `${JSON.stringify(
    {
      $schema: 'https://hyperframes.heygen.com/schema/hyperframes.json',
      registry: 'https://raw.githubusercontent.com/heygen-com/hyperframes/main/registry',
      paths: { blocks: 'compositions', components: 'compositions/components', assets: 'assets' },
      media: { autoProxy: true },
    },
    null,
    2,
  )}\n`,
);
writeFileSync(
  join(dir, 'meta.json'),
  `${JSON.stringify({ id, name: title, group: 'massive', kind: 'native', status: 'draft', source: null }, null, 2)}\n`,
);
writeFileSync(join(dir, 'media.json'), '[]\n');
copyFileSync(join(BRAND_DIR, 'frame.md'), join(dir, 'frame.md'));
writeFileSync(
  join(dir, 'STORYBOARD.md'),
  `---
format: ${w}x${h}
duration: 30s
message: ""
arc: ""
audience: ""
---

## Frame 1 — Opening

- scene:
- duration: 3s
- status: outline
`,
);
writeFileSync(
  join(dir, 'index.html'),
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${w}, height=${h}" />
    <title>${title}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Outfit:wght@100..900&family=JetBrains+Mono:wght@400;600;700&display=swap"
      rel="stylesheet"
    />
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script src="lib/frame-kit.js"></script>
    <link rel="stylesheet" href="lib/frame-kit.css" />
    <link rel="stylesheet" href="lib/massive.css" />
    <style>
      html,
      body {
        width: ${w}px;
        height: ${h}px;
        overflow: hidden;
        background: #0a0a0f;
      }
      #stage {
        position: relative;
        width: ${w}px;
        height: ${h}px;
        overflow: hidden;
      }
    </style>
  </head>
  <body>
    <div id="stage" data-composition-id="${id}" data-start="0" data-duration="3" data-fps="30" data-width="${w}" data-height="${h}">
      <div id="${id}-ground" class="clip m-ground" data-start="0" data-duration="3" data-track-index="0"></div>
      <div id="${id}-grid" class="clip m-dotgrid" data-start="0" data-duration="3" data-track-index="1"></div>
      <h1 id="${id}-title" class="clip m-h1" data-start="0" data-duration="3" data-track-index="2"
        style="position: absolute; left: 100px; top: 50%; margin-top: -50px; color: #faf4ec; font-family: Outfit, sans-serif">${title}</h1>
    </div>
    <script>
      // Placeholder: replace with the frames from STORYBOARD.md (one sub-composition per frame).
      const tl = gsap.timeline({ paused: true });
      tl.fromTo("#${id}-title", { opacity: 0 }, { opacity: 1, duration: 0.6 }, 0);
      window.__timelines["${id}"] = tl;
    </script>
  </body>
</html>
`,
);
spawnSync('node', ['scripts/video/sync-brand.mjs', id], { cwd: ROOT, stdio: 'inherit' });
console.log(`✓ public/video-projects/${id} (${w}×${h}). Next: plan STORYBOARD.md, then npm run video:index.`);
