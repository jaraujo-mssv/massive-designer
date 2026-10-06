// Password for the Content tab on the deployed site (Vercel Routing Middleware).
//
// The tab's campaigns are internal, and they're baked into the build: the markdown
// sits in the `protected-content` JS chunk (see manualChunks in vite.config.ts) and
// the images under /content/. So the files themselves are guarded, not just the page.
// It's HTTP Basic auth with one shared password, CONTENT_PASSWORD in the Vercel
// project's env vars; any username works. Without the variable it fails closed.
//
// This never runs under `vite dev` or `vite preview`, so the tab stays open locally.
import { next } from '@vercel/functions';

export const config = {
  // The page (/content?doc=…), its images, and the chunk that carries the markdown.
  matcher: ['/content', '/content/:path*', '/assets/(protected-content-.*)'],
};

const REALM = 'Massive Content';

/** Compares two strings in time that doesn't depend on where they first differ. */
function safeEqual(a: string, b: string) {
  let diff = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}

/** The password from an `Authorization: Basic …` header; the username is ignored. */
function passwordFrom(request: Request) {
  const header = request.headers.get('authorization') ?? '';
  if (!header.startsWith('Basic ')) return null;
  try {
    const decoded = atob(header.slice(6).trim());
    return decoded.slice(decoded.indexOf(':') + 1);
  } catch {
    return null;
  }
}

export default function middleware(request: Request) {
  // `vercel dev` on a laptop: open, like `vite dev`.
  if (process.env.VERCEL_ENV === 'development') return next();

  const password = process.env.CONTENT_PASSWORD;
  if (!password) {
    return new Response("Content isn't configured: set CONTENT_PASSWORD in the Vercel project.", {
      status: 503,
      headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' },
    });
  }

  const given = passwordFrom(request);
  if (given !== null && safeEqual(given, password)) return next({ headers: { 'X-Robots-Tag': 'noindex' } });

  return new Response('Password required', {
    status: 401,
    headers: {
      'WWW-Authenticate': `Basic realm="${REALM}", charset="UTF-8"`,
      'Cache-Control': 'no-store',
      'X-Robots-Tag': 'noindex',
    },
  });
}
