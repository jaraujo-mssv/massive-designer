// Scaffold a Massive image project in public/image-projects/<id>.
//
//   node scripts/image/new.mjs <id> "<title>" [--format=<format> | --size=<W>x<H>] [--light] [--category=<id>]
//   node scripts/image/new.mjs <id> "<title>" --from=<existing-id> [--category=<id>]
//   node scripts/image/new.mjs [<id> "<title>"] --plan=<planned-id>
//
// A blank project gets an index.html with #canvas at the format's size, the house CSS and image-kit,
// a meta.json with one example field, and an empty assets/. Formats: portrait 1080×1350, square, landscape,
// vertical (story), x (1200×675), og (link previews, 1200×630), youtube (thumbnail, 1280×720) and
// linkedin-cover (1128×191); --size=<W>x<H> takes any other size. --light starts on the light register
// (brand/BRAND.md) instead of the dark one. --from copies an existing project
// (page, assets and fields) as a starting point, under the new id and title, and records the layout it's
// built on as `template`: the source itself if it's a template, else the source's own template.
// --plan starts a Planned entry from planned.json: its id, title, category and series, its template (copied
// when it's a project) and first format; the entry then leaves planned.json.
import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECTS_DIR, readJson } from './lib/projects.mjs';

const FORMATS = {
  portrait: [1080, 1350],
  square: [1080, 1080],
  landscape: [1920, 1080],
  vertical: [1080, 1920],
  x: [1200, 675],
  og: [1200, 630],
  youtube: [1280, 720],
  'linkedin-cover': [1128, 191],
};

// planned.json says "story" for 1080×1920; new.mjs has always called it "vertical".
const PLAN_FORMATS = { portrait: 'portrait', square: 'square', landscape: 'landscape', story: 'vertical' };

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const planId = flag('plan');
const plannedPath = join(PROJECTS_DIR, 'planned.json');
const planned = readJson(plannedPath, []);
const plan = planId ? planned.find((p) => p.id === planId) : null;
if (planId && !plan) {
  console.error(`No planned entry "${planId}" in public/image-projects/planned.json.`);
  process.exit(1);
}
const [id = plan?.id, title = plan?.title] = args.filter((a) => !a.startsWith('--'));
const planTemplate = plan?.template && !plan.template.startsWith('video:') && plan.template !== 'new' ? plan.template : null;
const format = flag('format') ?? PLAN_FORMATS[plan?.formats?.[0]] ?? 'portrait';
const size = flag('size')?.match(/^(\d+)x(\d+)$/);
const light = args.includes('--light');
const from = flag('from') ?? planTemplate;
const category = flag('category') ?? plan?.category;
if (!id || !title || !/^[a-z0-9][a-z0-9-]*$/.test(id) || (!size && !FORMATS[format]) || (flag('size') && !size)) {
  console.error(
    `Usage: npm run image:new <kebab-id> "<Title>" [--format=${Object.keys(FORMATS).join('|')} | --size=<W>x<H>] [--light] [--from=<id>] [--category=<id>] [--plan=<planned-id>]`,
  );
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
  const template = meta.group === 'templates' ? from : (meta.template ?? from);
  const next = { ...meta, id, title, group: 'massive', status: 'draft', source: `image-projects/${from}`, template };
  if (category) next.category = category;
  if (plan?.series) next.series = plan.series;
  writeFileSync(join(dir, 'meta.json'), `${JSON.stringify(next, null, 2)}\n`);
  console.log(`✓ public/image-projects/${id} (from ${from})`);
} else {
  const [w, h] = size ? [Number(size[1]), Number(size[2])] : FORMATS[format];
  // The headline and margin shrink on short or narrow canvases (a LinkedIn cover is 191 px tall).
  const fontSize = Math.round(Math.min(120, w / 9, h / 3));
  const pad = Math.round(Math.min(80, h / 6));
  mkdirSync(join(dir, 'assets'), { recursive: true });
  writeFileSync(
    join(dir, 'meta.json'),
    `${JSON.stringify(
      {
        id,
        title,
        description: '',
        group: 'massive',
        category: category ?? null,
        template: null,
        series: plan?.series ?? null,
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
        left: ${pad}px;
        right: ${pad}px;
        top: ${pad}px;
        font-size: ${fontSize}px;
        font-weight: 900;
        line-height: 1.05;
        letter-spacing: -0.045em;
      }
    </style>
  </head>
  <body>
    <div id="canvas"${light ? ' class="soft-orange"' : ''}>
      <div class="${light ? 'm-linegrid' : 'm-dotgrid'}"></div>
      <div class="headline" data-field="headline">${title}</div>
    </div>
    <script src="../_lib/image-kit.js"></script>
  </body>
</html>
`,
  );
  console.log(`✓ public/image-projects/${id} · ${w}×${h}`);
}
if (plan) {
  writeFileSync(plannedPath, `${JSON.stringify(planned.filter((p) => p !== plan), null, 2)}\n`);
  console.log(`· removed "${plan.id}" from planned.json${plan.brief ? `. Brief: ${plan.brief}` : ''}`);
  if (plan.formats?.length > 1) console.log(`· the plan also asks for: ${plan.formats.slice(1).join(', ')}`);
}
console.log(`Next: edit index.html and meta.json, then npm run image:render ${id} && npm run image:index`);
