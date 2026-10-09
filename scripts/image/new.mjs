// Scaffold a Massive image project in public/image-projects/<id>.
//
//   node scripts/image/new.mjs <id> "<title>" [--format=portrait|square|landscape|vertical|x]
//   node scripts/image/new.mjs <id> "<title>" --from=<existing-id>
//
// A blank project gets an index.html with #canvas at the format's size, the house CSS and image-kit,
// a meta.json with one example field, and an empty assets/. --from copies an existing project
// (page, assets and fields) as a starting point, under the new id and title.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECTS_DIR, readJson } from './lib/projects.mjs';

const FORMATS = {
  portrait: [1080, 1350],
  square: [1080, 1080],
  landscape: [1920, 1080],
  vertical: [1080, 1920],
  x: [1200, 675],
};

const args = process.argv.slice(2);
const [id, title] = args.filter((a) => !a.startsWith('--'));
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const format = flag('format') ?? 'portrait';
const from = flag('from');
if (!id || !title || !/^[a-z0-9][a-z0-9-]*$/.test(id) || !FORMATS[format]) {
  console.error(`Usage: npm run image:new <kebab-id> "<Title>" [--format=${Object.keys(FORMATS).join('|')}] [--from=<id>]`);
  process.exit(1);
}
const dir = join(PROJECTS_DIR, id);
if (existsSync(dir)) {
  console.error(`public/image-projects/${id} already exists.`);
  process.exit(1);
}

if (from) {
  const src = join(PROJECTS_DIR, from);
  if (!existsSync(join(src, 'index.html'))) {
    console.error(`No image project "${from}".`);
    process.exit(1);
  }
  cpSync(src, dir, { recursive: true });
  rmSync(join(dir, 'thumb.jpg'), { force: true });
  const meta = readJson(join(dir, 'meta.json'), {});
  writeFileSync(
    join(dir, 'meta.json'),
    `${JSON.stringify({ ...meta, id, title, group: 'massive', status: 'draft', source: `image-projects/${from}` }, null, 2)}\n`,
  );
  console.log(`✓ public/image-projects/${id} (from ${from})`);
} else {
  const [w, h] = FORMATS[format];
  mkdirSync(join(dir, 'assets'), { recursive: true });
  writeFileSync(
    join(dir, 'meta.json'),
    `${JSON.stringify(
      {
        id,
        title,
        description: '',
        group: 'massive',
        series: null,
        status: 'draft',
        tags: [],
        source: null,
        width: w,
        height: h,
        fields: [{ id: 'headline', label: 'Headline', type: 'text', default: title }],
      },
      null,
      2,
    )}\n`,
  );
  writeFileSync(
    join(dir, 'index.html'),
    `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=${w}, height=${h}" />
    <title>${title}</title>
    <link rel="stylesheet" href="../_brand/massive.css" />
    <style>
      #canvas {
        width: ${w}px;
        height: ${h}px;
      }
      .headline {
        position: absolute;
        left: 80px;
        right: 80px;
        top: 80px;
        font-size: 120px;
        font-weight: 900;
        line-height: 1.05;
        letter-spacing: -0.045em;
      }
    </style>
  </head>
  <body>
    <div id="canvas">
      <div class="m-dotgrid"></div>
      <div class="headline" data-field="headline">${title}</div>
    </div>
    <script src="../_lib/image-kit.js"></script>
  </body>
</html>
`,
  );
  console.log(`✓ public/image-projects/${id} · ${w}×${h}`);
}
console.log(`Next: edit index.html and meta.json, then npm run image:render ${id} && npm run image:index`);
