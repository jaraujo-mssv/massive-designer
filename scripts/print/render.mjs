// Render print pieces to PDF at the size each page declares, plus a PNG of page 1 to check.
//
//   node scripts/print/render.mjs [<slug | path/to/page.html> ...]     (npm run print -- <...>)
//
// A slug is scripts/print/<slug>.html; any other HTML file works too (it's opened from disk, so its
// relative links resolve). No arguments: every scripts/print/*.html except _template.html.
// The PDF follows the page's own @page { size } (print:new writes it). Output: output/print/<name>.pdf
// and output/print/<name>.png (the first .page, or the first screen without one).
// Each page is also checked against the mono rule (scripts/design/mono.mjs): monospace only for code.
import { existsSync, mkdirSync, readdirSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';
import { monoMisuse } from '../design/mono.mjs';

const DIR = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(DIR, '../../output/print');

const args = process.argv.slice(2);
const files = (args.length ? args : readdirSync(DIR).filter((f) => f.endsWith('.html') && !f.startsWith('_')))
  .map((a) => (a.endsWith('.html') ? resolve(a.includes('/') ? a : join(DIR, a)) : join(DIR, `${a}.html`)));
const unknown = files.filter((f) => !existsSync(f));
if (unknown.length) {
  console.error(`Not found: ${unknown.join(', ')}`);
  process.exit(1);
}
if (!files.length) {
  console.error('Nothing to render. Start one with npm run print:new <slug>.');
  process.exit(1);
}

mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 2 });
for (const file of files) {
  const name = basename(file, '.html');
  const page = await ctx.newPage();
  await page.goto(pathToFileURL(file).href, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);

  for (const { where, text } of await monoMisuse(page)) {
    console.warn(`  ⚠ ${name}: monospace outside code at ${where} ("${text}"). Use Outfit, or <code> for real code.`);
  }

  const pdf = join(OUT, `${name}.pdf`);
  await page.pdf({ path: pdf, printBackground: true, preferCSSPageSize: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
  const first = page.locator('.page').first();
  const png = join(OUT, `${name}.png`);
  if (await first.count()) await first.screenshot({ path: png });
  else await page.screenshot({ path: png });

  const pages = await page.locator('.page').count();
  console.log(`✓ output/print/${name}.pdf${pages ? ` (${pages} page${pages === 1 ? '' : 's'})` : ''} + .png`);
  await page.close();
}
await browser.close();
