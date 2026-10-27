// Render an image project to a JPG on the server, the way scripts/image/render.mjs does locally: the project
// folder served from disk on 127.0.0.1, opened in headless Chromium at its canvas size, field values applied
// through image-kit, and #canvas captured.
//
// On Vercel, Chromium is @sparticuz/chromium (its version is paired with playwright-core's; upgrade both
// together). Locally it's the Chromium `npm run setup` installs for Playwright. One browser is kept per
// instance, with a fresh context per render and at most two renders at a time, since the Lambda build runs
// single-process and one crash takes every page with it.
import { copyFileSync, createReadStream, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { extname, join, normalize, relative } from 'node:path';
import { chromium, type Browser } from 'playwright-core';

/** public/image-projects, bundled into the function by vercel.json's includeFiles. */
export const PROJECTS_DIR = join(process.cwd(), 'public/image-projects');

/** Noto Color Emoji, COLRv1 only (the Google Fonts build with its OpenType-SVG table dropped, 25 → 5 MB). */
const EMOJI_FONT = join(process.cwd(), 'api/_lib/fonts/NotoColorEmoji.ttf');

const MAX_RENDERS = 2;

const TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ttf': 'font/ttf',
  '.woff2': 'font/woff2',
};

export function readMeta(id: string): { width?: number; height?: number; fields?: unknown[] } | null {
  try {
    return JSON.parse(readFileSync(join(PROJECTS_DIR, id, 'meta.json'), 'utf8'));
  } catch {
    return null;
  }
}

// --- The project files, on a local port (image-kit fetches meta.json, which a data: or file: page can't) ---

let serverBase: Promise<string> | null = null;

function filesServer(): Promise<string> {
  serverBase ??= new Promise((resolve, reject) => {
    const server = createServer((req, res) => {
      const path = normalize(decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname)).replace(/^\/image-projects/, '');
      const file = join(PROJECTS_DIR, path);
      if (relative(PROJECTS_DIR, file).startsWith('..') || !existsSync(file) || !statSync(file).isFile()) {
        res.writeHead(404).end();
        return;
      }
      res.writeHead(200, { 'Content-Type': TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream' });
      createReadStream(file).pipe(res);
    });
    server.on('error', (err) => {
      serverBase = null;
      reject(err);
    });
    server.listen(0, '127.0.0.1', () => resolve(`http://127.0.0.1:${(server.address() as AddressInfo).port}`));
    server.unref();
  });
  return serverBase;
}

// --- The browser ---

let browserPromise: Promise<Browser> | null = null;

async function launch(): Promise<Browser> {
  if (process.platform !== 'linux' || !process.env.VERCEL) return chromium.launch();
  const { default: lambda } = await import('@sparticuz/chromium');
  lambda.setGraphicsMode = false; // no WebGL in any image; skips unpacking SwiftShader
  const executablePath = await lambda.executablePath();
  // Lambda has no system fonts but the few sparticuz unpacks to /tmp/fonts; add emoji beside them.
  const fonts = join(tmpdir(), 'fonts');
  mkdirSync(fonts, { recursive: true });
  if (!existsSync(join(fonts, 'NotoColorEmoji.ttf'))) copyFileSync(EMOJI_FONT, join(fonts, 'NotoColorEmoji.ttf'));
  // Keep same-origin rules on: the pages never need them off.
  const args = lambda.args.filter((a) => a !== '--disable-web-security' && a !== '--allow-running-insecure-content');
  return chromium.launch({ executablePath, args, headless: true });
}

function browser(): Promise<Browser> {
  browserPromise ??= launch().then(
    (b) => {
      b.on('disconnected', () => {
        browserPromise = null;
        // Profiles a crashed browser leaves behind would fill /tmp over a warm instance's life.
        for (const name of readdirSync(tmpdir())) {
          if (name.startsWith('playwright_chromiumdev_profile-')) rmSync(join(tmpdir(), name), { recursive: true, force: true });
        }
      });
      return b;
    },
    (err) => {
      browserPromise = null;
      throw err;
    },
  );
  return browserPromise;
}

// --- At most MAX_RENDERS at once ---

let running = 0;
const waiting: (() => void)[] = [];

async function limited<T>(task: () => Promise<T>): Promise<T> {
  if (running >= MAX_RENDERS) await new Promise<void>((go) => waiting.push(go));
  running++;
  try {
    return await task();
  } finally {
    running--;
    waiting.shift()?.();
  }
}

/** The project's #canvas as a JPEG, with `values` applied over its defaults. */
export function renderImage(opts: {
  id: string;
  width: number;
  height: number;
  scale: number;
  values: Record<string, string | boolean>;
}): Promise<Buffer> {
  return limited(async () => {
    const [b, base] = await Promise.all([browser(), filesServer()]);
    const context = await b.newContext({ viewport: { width: opts.width, height: opts.height }, deviceScaleFactor: opts.scale });
    try {
      // The project's own files and Google Fonts (massive.css imports Outfit); nothing else leaves the box.
      // Photos from links arrive already inlined as data: URLs.
      await context.route('**/*', (route) => {
        const url = route.request().url();
        const ok = url.startsWith(`${base}/`) || url.startsWith('https://fonts.googleapis.com/') || url.startsWith('https://fonts.gstatic.com/');
        return ok ? route.continue() : route.abort();
      });
      const page = await context.newPage();
      await page.goto(`${base}/image-projects/${opts.id}/index.html`, { waitUntil: 'load', timeout: 20_000 });
      await page.waitForSelector('html[data-ready="1"]', { timeout: 20_000 });
      await page.evaluate(
        (values) => (window as unknown as { imageKit: { apply: (v: unknown) => Promise<void> } }).imageKit.apply(values),
        opts.values,
      );
      return await page.locator('#canvas').screenshot({ type: 'jpeg', quality: 95 });
    } finally {
      await context.close();
    }
  });
}
