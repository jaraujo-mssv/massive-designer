// Render image projects to output/images/<id>.jpg (2×) and a small thumb.jpg for the Images tab.
//
//   node scripts/image/render.mjs <project-id...>
//   node scripts/image/render.mjs --all
//   node scripts/image/render.mjs <project-id> --fields '<json>' [--name <out>]
//   node scripts/image/render.mjs <project-id...> --pdf <name>
//
// Pages are served from public/ on a local port (image-kit fetches meta.json, which file:// blocks),
// opened in headless Chromium, and captured once image-kit marks <html data-ready="1">.
// --fields overrides field values (e.g. '{"name":"Ana"}') and --name sets the output file;
// overridden renders don't touch the project's thumb.jpg.
// --pdf also joins the renders, in the order given, into output/images/<name>.pdf: one page per image,
// for a LinkedIn document carousel. The images must all be the same size.
//
// Each page is also checked against the mono rule (scripts/design/mono.mjs): monospace only for code.
// Images made before the rule only warn.
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, relative } from 'node:path';
import { chromium } from 'playwright';
import { monoMisuse } from '../design/mono.mjs';
import { OUTPUT_DIR, PROJECTS_DIR, PUBLIC_DIR, ROOT, pickProjects, readJson } from './lib/projects.mjs';

const args = process.argv.slice(2);
const valueOf = (flag) => {
  const i = args.indexOf(flag);
  return i === -1 ? undefined : args[i + 1];
};
const VALUE_FLAGS = ['--fields', '--name', '--pdf'];
const ids = args.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.includes(args[i - 1]));
const fields = valueOf('--fields');
const outName = valueOf('--name');
const pdfName = valueOf('--pdf');
if ((fields || outName) && ids.length !== 1) {
  console.error('--fields and --name need exactly one project id.');
  process.exit(1);
}
if (!ids.length && !args.includes('--all')) {
  console.error('Usage: npm run image:render <project-id...> | --all [--fields <json> --name <out>]');
  process.exit(1);
}
const projects = pickProjects(ids);

const TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

const server = createServer((req, res) => {
  const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
  const file = join(PUBLIC_DIR, path);
  if (relative(PUBLIC_DIR, file).startsWith('..') || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
});
await new Promise((done) => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;

mkdirSync(OUTPUT_DIR, { recursive: true });
const browser = await chromium.launch();
let failed = 0;
const rendered = [];
try {
  for (const id of projects) {
    const meta = readJson(join(PROJECTS_DIR, id, 'meta.json'), {});
    const width = meta.width ?? 1080;
    const height = meta.height ?? 1350;
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 2 });
    page.on('pageerror', (err) => console.error(`  ${id}: ${err.message}`));
    try {
      await page.goto(`${base}/image-projects/${id}/index.html`, { waitUntil: 'networkidle' });
      await page.waitForSelector('html[data-ready="1"]', { timeout: 20_000 });
      if (fields) await page.evaluate((values) => window.imageKit.apply(values), JSON.parse(fields));
      for (const { where, text } of await monoMisuse(page)) {
        console.warn(`  ⚠ ${id}: monospace outside code at ${where} ("${text}"). Use Outfit, or <code> for real code.`);
      }
      const out = join(OUTPUT_DIR, `${outName ?? id}.jpg`);
      const jpg = await page.locator('#canvas').screenshot({ type: 'jpeg', quality: 95 });
      writeFileSync(out, jpg);
      rendered.push({ id, jpg, width, height });

      if (!fields) {
        // Thumbnail: the render drawn small in a blank page.
        const thumb = await browser.newPage({ viewport: { width: 360, height: Math.round((360 * height) / width) } });
        await thumb.setContent(
          `<body style="margin:0"><img style="display:block;width:100%" src="data:image/jpeg;base64,${jpg.toString('base64')}"></body>`,
        );
        await thumb.screenshot({ path: join(PROJECTS_DIR, id, 'thumb.jpg'), type: 'jpeg', quality: 82 });
        await thumb.close();
      }
      console.log(`✓ ${relative(ROOT, out)} · ${width * 2}×${height * 2}`);
    } catch (err) {
      failed++;
      console.error(`✗ ${id}: ${err.message}`);
    } finally {
      await page.close();
    }
  }
  if (pdfName && !failed) {
    const [{ width, height }] = rendered;
    const odd = rendered.filter((r) => r.width !== width || r.height !== height).map((r) => r.id);
    if (odd.length) {
      console.error(`✗ --pdf needs images of one size; ${odd.join(', ')} differ from ${width}×${height}.`);
      failed++;
    } else {
      const page = await browser.newPage();
      const imgs = rendered.map((r) => `<img src="data:image/jpeg;base64,${r.jpg.toString('base64')}">`).join('');
      await page.setContent(
        `<style>@page{size:${width}px ${height}px;margin:0}body{margin:0}img{display:block;width:${width}px;height:${height}px;break-after:page}img:last-child{break-after:auto}</style>${imgs}`,
      );
      const out = join(OUTPUT_DIR, `${pdfName}.pdf`);
      await page.pdf({ path: out, preferCSSPageSize: true, printBackground: true });
      await page.close();
      console.log(`✓ ${relative(ROOT, out)} · ${rendered.length} pages`);
    }
  }
} finally {
  await browser.close();
  server.close();
}
process.exit(failed ? 1 : 0);
