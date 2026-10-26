// Start a print piece: a poster, one-pager, flyer, card or sign, as one HTML file in scripts/print/.
//
//   node scripts/print/new.mjs <slug> ["<Title>"] [--size=A4|A5|A3|A2|letter|<W>x<H>mm] [--landscape] [--from=<slug>]
//   (npm run print:new <slug> "<Title>" -- --size=A3)
//
// Writes scripts/print/<slug>.html on print.css (brand/BRAND.md's light register) with the page size in its
// <style id="page-size">: @page size, --page-w, --page-h, and --s, which scales type and spacing to the page
// (1 on A4). --from copies another piece in scripts/print/ instead of the template, resized when --size is given.
// Then edit the HTML and run npm run print <slug>.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const SIZES = { A5: [148, 210], A4: [210, 297], A3: [297, 420], A2: [420, 594], letter: [215.9, 279.4] };

const args = process.argv.slice(2);
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.slice(name.length + 3);
const [slug, title = 'Headline that says the one thing'] = args.filter((a) => !a.startsWith('--'));

function die(msg) {
  console.error(msg);
  process.exit(1);
}

/** "A3", "letter" or "600x900mm" → [w, h] in mm. */
function parseSize(size) {
  const named = Object.entries(SIZES).find(([k]) => k.toLowerCase() === size.toLowerCase());
  if (named) return [...named[1]];
  const m = size.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)mm$/i);
  if (!m) die(`Unknown --size=${size}. Use ${Object.keys(SIZES).join(', ')} or <W>x<H>mm.`);
  return [Number(m[1]), Number(m[2])];
}

const sizeBlock = ([w, h]) => {
  const s = Math.round((Math.min(w, h) / 210) * 100) / 100;
  return `<style id="page-size">
  @page { size: ${w}mm ${h}mm; }
  :root { --page-w: ${w}mm; --page-h: ${h}mm; --s: ${s}; }
</style>`;
};

if (!slug || !/^[a-z0-9][a-z0-9-]*$/.test(slug)) {
  die('Usage: npm run print:new <kebab-slug> ["<Title>"] -- [--size=A4|A5|A3|A2|letter|<W>x<H>mm] [--landscape] [--from=<slug>]');
}
const out = join(DIR, `${slug}.html`);
if (existsSync(out)) die(`scripts/print/${slug}.html already exists.`);

let size = parseSize(flag('size') ?? 'A4');
if (args.includes('--landscape')) size = [Math.max(...size), Math.min(...size)];

const from = flag('from');
let html;
if (from) {
  const src = join(DIR, `${from}.html`);
  if (!existsSync(src)) die(`scripts/print/${from}.html not found.`);
  html = readFileSync(src, 'utf8');
  if (flag('size')) html = html.replace(/<style id="page-size">[\s\S]*?<\/style>/, sizeBlock(size));
} else {
  html = readFileSync(join(DIR, '_template.html'), 'utf8')
    .replace(/<style id="page-size">[\s\S]*?<\/style>/, sizeBlock(size))
    .replaceAll('{{TITLE}}', title);
}
writeFileSync(out, html);
console.log(`✓ scripts/print/${slug}.html (${size[0]}×${size[1]} mm)`);
console.log(`  Edit it, then: npm run print ${slug}  →  output/print/${slug}.pdf + .png`);
