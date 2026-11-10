// The production server for hosts that run a long-lived Node process (Railway), in place of what Vercel does with
// vercel.json: the built app from dist/, the API handlers from api/ as they are, and every other path answered with
// index.html so the router can take it. Built by server/build.mjs into dist-server/; `npm start` runs it.
//
// Vercel's edge did two things this has to do itself: a CDN that kept each rendered image (here, an in-memory cache
// of /api/render answers), and a rate limit on /api/render (here, per client IP, counting renders, not cache hits).
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { createGzip } from 'node:zlib';
import imageProxy from '../api/image-proxy';
import images from '../api/images';
import render from '../api/render/[id]';
import { originOf } from '../api/_lib/origin';
import { SITE_URL } from '../src/tools/images/params';

const PORT = Number(process.env.PORT ?? 3000);
const DIST = resolve(process.cwd(), 'dist');
const INDEX = join(DIST, 'index.html');

/** Renders kept in memory, newest last, up to this many bytes in all (an image is about 0.3–1 MB). */
const RENDER_CACHE_BYTES = Number(process.env.RENDER_CACHE_MB ?? 200) * 1024 * 1024;
/** Renders a client IP may start in a minute; cached answers don't count. */
const RENDERS_PER_MINUTE = Number(process.env.RENDERS_PER_MINUTE ?? 20);

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.zip': 'application/zip',
};
const COMPRESSIBLE = /^(text\/|application\/(json|xml|javascript)|image\/svg)/;

type Handler = (req: IncomingMessage, res: ServerResponse) => unknown;

// --- Static files ---

/** The file under dist/ that a path names (a folder's index.html too), or null. Never outside dist/. */
function fileFor(pathname: string): string | null {
  let path: string;
  try {
    path = normalize(decodeURIComponent(pathname));
  } catch {
    return null;
  }
  const file = join(DIST, path);
  if (file !== DIST && !file.startsWith(DIST + sep)) return null;
  if (!existsSync(file)) return null;
  const stat = statSync(file);
  if (stat.isFile()) return file;
  const index = join(file, 'index.html');
  return stat.isDirectory() && existsSync(index) ? index : null;
}

function sendFile(req: IncomingMessage, res: ServerResponse, file: string, status = 200) {
  const stat = statSync(file);
  const type = TYPES[extname(file).toLowerCase()] ?? 'application/octet-stream';
  const etag = `"${stat.size.toString(36)}-${Math.floor(stat.mtimeMs).toString(36)}"`;
  // Vite's hashed bundles never change; everything else is checked each time, as Vercel serves it.
  const hashed = file.startsWith(join(DIST, 'assets') + sep);
  const headers: Record<string, string | number> = {
    'Content-Type': type,
    'Cache-Control': hashed ? 'public, max-age=31536000, immutable' : 'public, max-age=0, must-revalidate',
    ETag: etag,
  };
  if (status === 200 && req.headers['if-none-match'] === etag) {
    res.writeHead(304, headers).end();
    return;
  }
  const gzip = COMPRESSIBLE.test(type) && stat.size > 1024 && /\bgzip\b/.test(String(req.headers['accept-encoding'] ?? ''));
  if (COMPRESSIBLE.test(type)) headers.Vary = 'Accept-Encoding';
  if (gzip) headers['Content-Encoding'] = 'gzip';
  else headers['Content-Length'] = stat.size;
  res.writeHead(status, headers);
  if (req.method === 'HEAD') {
    res.end();
    return;
  }
  const stream = createReadStream(file);
  stream.on('error', () => res.destroy());
  (gzip ? stream.pipe(createGzip()) : stream).pipe(res);
}

/** public/llms.txt names the site in its links (SITE_URL, when it was built): answer with this server's own. */
function llms(req: IncomingMessage, res: ServerResponse) {
  const body = readFileSync(join(DIST, 'llms.txt'), 'utf8').replaceAll(SITE_URL, originOf(req));
  res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=300' });
  res.end(req.method === 'HEAD' ? undefined : body);
}

// --- /api/render: a cache in front, and a rate limit on what isn't cached ---

type Answer = { status: number; headers: Record<string, string | number>; body: Buffer };

/** Runs a handler that answers with writeHead and end (as api/render does), and returns what it sent. */
function capture(handler: Handler, req: IncomingMessage): Promise<Answer> {
  return new Promise((done, fail) => {
    let status = 200;
    let headers: Record<string, string | number> = {};
    const res = {
      writeHead(code: number, h?: Record<string, string | number>) {
        status = code;
        headers = { ...headers, ...h };
        return res;
      },
      setHeader(name: string, value: string | number) {
        headers[name] = value;
      },
      end(chunk?: Buffer | string) {
        done({ status, headers, body: chunk === undefined ? Buffer.alloc(0) : Buffer.from(chunk) });
        return res;
      },
    };
    Promise.resolve(handler(req, res as unknown as ServerResponse)).catch(fail);
  });
}

const cache = new Map<string, Answer>();
let cachedBytes = 0;
const rendering = new Map<string, Promise<Answer>>();
const starts = new Map<string, number[]>();

function remember(key: string, answer: Answer) {
  if (answer.status !== 200 || answer.body.length > RENDER_CACHE_BYTES / 4) return;
  cache.set(key, answer);
  cachedBytes += answer.body.length;
  for (const [oldest, old] of cache) {
    if (cachedBytes <= RENDER_CACHE_BYTES) break;
    cache.delete(oldest);
    cachedBytes -= old.body.length;
  }
}

/**
 * The client's IP: X-Real-IP, which Railway's edge sets (and overwrites if a client sends one), else the last
 * X-Forwarded-For entry, the one the nearest proxy added (a client can put anything before it).
 */
const clientIp = (req: IncomingMessage) =>
  String(req.headers['x-real-ip'] ?? '').trim() ||
  String(req.headers['x-forwarded-for'] ?? '').split(',').pop()?.trim() ||
  req.socket.remoteAddress ||
  'unknown';

/** Whether this IP may start another render now (a sliding minute). */
function allowed(ip: string): boolean {
  const now = Date.now();
  const recent = (starts.get(ip) ?? []).filter((t) => now - t < 60_000);
  if (recent.length >= RENDERS_PER_MINUTE) {
    starts.set(ip, recent);
    return false;
  }
  recent.push(now);
  starts.set(ip, recent);
  return true;
}
// Forget idle IPs now and then
setInterval(() => {
  const now = Date.now();
  for (const [ip, times] of starts) if (times.every((t) => now - t >= 60_000)) starts.delete(ip);
}, 5 * 60_000).unref();

async function renderCached(req: IncomingMessage, res: ServerResponse) {
  // The handler answers by the URL alone (and the host, in its error links): the same URL is the same answer.
  const key = `${originOf(req)}${req.url}`;
  let answer = cache.get(key);
  if (answer) {
    // Newest last, so the oldest is evicted first
    cache.delete(key);
    cache.set(key, answer);
  } else {
    let pending = rendering.get(key);
    if (!pending) {
      if (!allowed(clientIp(req))) {
        res.writeHead(429, { 'Content-Type': 'text/plain; charset=utf-8', 'Retry-After': '60', 'Cache-Control': 'no-store' });
        res.end(`Too many images at once: at most ${RENDERS_PER_MINUTE} a minute. Try again in a minute.\n`);
        return;
      }
      pending = capture(render, req).finally(() => rendering.delete(key));
      rendering.set(key, pending);
    }
    answer = await pending;
    remember(key, answer);
  }
  res.writeHead(answer.status, answer.headers);
  res.end(req.method === 'HEAD' ? undefined : answer.body);
}

// --- Routes ---

const api: [RegExp, Handler][] = [
  [/^\/api\/image-proxy$/, imageProxy],
  [/^\/api\/images$/, images],
  [/^\/api\/render\//, renderCached],
  [/^\/api\/health$/, (_req, res) => res.writeHead(200, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' }).end('ok\n')],
];

const server = createServer(async (req, res) => {
  const started = Date.now();
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  if (pathname.startsWith('/api/') && pathname !== '/api/health') {
    res.on('finish', () => console.log(`${req.method} ${req.url} ${res.statusCode} ${Date.now() - started}ms`));
  }
  try {
    const route = api.find(([pattern]) => pattern.test(pathname));
    if (route) {
      await route[1](req, res);
    } else if (pathname.startsWith('/api/')) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Not found\n');
    } else if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    } else if (pathname === '/llms.txt') {
      llms(req, res);
    } else {
      const file = fileFor(pathname);
      if (file) sendFile(req, res, file);
      // As vercel.json's rewrite: everything else is the app, but the local-only video projects stay a 404.
      else if (pathname.startsWith('/video-projects/')) res.writeHead(404).end();
      else sendFile(req, res, INDEX);
    }
  } catch (err) {
    console.error(`${req.method} ${req.url} failed`, err);
    if (!res.headersSent) res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Server error\n');
  }
});

if (!existsSync(INDEX)) {
  console.error(`No ${INDEX}: run npm run build first`);
  process.exit(1);
}
// "::" takes IPv4 too, and IPv6 is what Railway's private network uses
server.listen(PORT, '::', () => console.log(`Massive Designer on port ${PORT}`));
const stop = () => server.close(() => process.exit(0));
process.on('SIGTERM', stop);
process.on('SIGINT', stop);
