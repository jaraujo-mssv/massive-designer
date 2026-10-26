// The mono rule: JetBrains Mono (or any monospace) only for code, and for values that need a
// fixed-width face: commands, file paths, cron lines, API parameters, hashes. Never for eyebrows,
// labels, counters, badges, URLs in a footer or other decoration; those are Outfit.
//
// Enforced in the browser: any visible text whose computed font is monospace must sit inside
// code, pre, kbd, samp or .m-code. Text drawn on a <canvas> can't be checked; keep it in Outfit.
//
//   node scripts/design/mono.mjs <page...>     (npm run design:mono -- <page...>)
//
// A page is a path under public/, with or without the public/ prefix; a folder means its index.html:
//   npm run design:mono -- video-projects/gif-opt-in image-projects/jason-15k-grid
// or a page under scripts/ (decks, docs, print, merch), with or without .html:
//   npm run design:mono -- scripts/print/meetup-poster scripts/deck/consent-sourcing.html
//
// gif.mjs refuses to render a GIF that breaks the rule; image/render.mjs warns.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const PUBLIC = join(ROOT, 'public');
const SCRIPTS = join(ROOT, 'scripts');
export const MONO_ALLOWED = 'code, pre, kbd, samp, .m-code';

const TYPES = {
  '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
};

/** Monospace text outside code elements on an open page: [{ where, text }]. */
export function monoMisuse(page) {
  return page.evaluate((allowed) => {
    const found = new Map();
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walk.nextNode(); node; node = walk.nextNode()) {
      const text = node.textContent.replace(/\s+/g, ' ').trim();
      const el = node.parentElement;
      if (!text || !el || el.closest('script, style, title')) continue;
      const style = getComputedStyle(el);
      if (!/mono/i.test(style.fontFamily) || el.closest(allowed)) continue;
      if (style.display === 'none') continue;
      const name = (n) => {
        const cls = typeof n.className === 'string' ? n.className.trim().split(/\s+/).filter(Boolean).join('.') : '';
        return n.id ? `#${n.id}` : `${n.tagName.toLowerCase()}${cls ? `.${cls}` : ''}`;
      };
      const where = el.parentElement && !el.id ? `${name(el.parentElement)} > ${name(el)}` : name(el);
      if (!found.has(where)) found.set(where, text.slice(0, 48));
    }
    return [...found].map(([where, text]) => ({ where, text }));
  }, MONO_ALLOWED);
}

/** "video-projects/x", "public/video-projects/x/index.html" → path under public/ of an HTML file;
 *  "scripts/print/x" → scripts/print/x.html. */
const toPage = (p) => {
  let rel = normalize(p).replace(/\/$/, '');
  if (rel.startsWith('scripts/')) return rel.endsWith('.html') ? rel : `${rel}.html`;
  rel = rel.replace(/^public\//, '');
  if (!rel.endsWith('.html')) rel = `${rel}/index.html`;
  return rel;
};

/** URL path → file: /scripts/… and /public/… from the repo root (scripts' pages link ../../public/…), else public/. */
const toFile = (pathname) => {
  const rel = decodeURIComponent(pathname).replace(/^\/+/, '');
  return normalize(/^(scripts|public)\//.test(rel) ? join(ROOT, rel) : join(PUBLIC, rel));
};
const inside = (dir, file) => !relative(dir, file).startsWith('..');

/** Open each page from a local server over public/ and scripts/ and return { page: problems[] } for the ones that
 *  break the rule. */
export async function checkMono(pages) {
  const server = createServer((req, res) => {
    const file = toFile(new URL(req.url, 'http://x').pathname);
    if (!(inside(PUBLIC, file) || inside(SCRIPTS, file)) || !existsSync(file) || statSync(file).isDirectory()) {
      res.writeHead(404).end();
      return;
    }
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
  const base = `http://127.0.0.1:${server.address().port}`;
  const browser = await chromium.launch();
  const results = {};
  try {
    for (const p of pages.map(toPage)) {
      const page = await browser.newPage({ viewport: { width: 1920, height: 1920 } });
      const res = await page.goto(`${base}/${p}`, { waitUntil: 'networkidle' });
      if (!res?.ok()) {
        results[p] = [{ where: 'page', text: 'not found' }];
        await page.close();
        continue;
      }
      await page.evaluate(() => document.fonts.ready);
      const problems = await monoMisuse(page);
      if (problems.length) results[p] = problems;
      await page.close();
    }
  } finally {
    await browser.close();
    server.close();
  }
  return results;
}

export function formatMono(results) {
  return Object.entries(results)
    .map(([p, problems]) => `${p}\n${problems.map(({ where, text }) => `    ${where}: "${text}"`).join('\n')}`)
    .join('\n');
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const pages = process.argv.slice(2);
  if (!pages.length) {
    console.error('Usage: npm run design:mono -- <page or project folder under public/, or a page under scripts/...>');
    process.exit(1);
  }
  const results = await checkMono(pages);
  if (!Object.keys(results).length) {
    console.log(`✓ mono rule: ${pages.length} page(s) use monospace only for code`);
  } else {
    console.error(`✗ Monospace outside code (wrap real code in <code>/<pre> or .m-code; everything else is Outfit):\n${formatMono(results)}`);
    process.exit(1);
  }
}
