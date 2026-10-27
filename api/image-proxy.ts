import type { IncomingMessage, ServerResponse } from 'node:http';
import { ImageFetchError, fetchImage } from './_lib/safe-fetch.js';

export default async function handler(req: IncomingMessage & { query?: Record<string, string> }, res: ServerResponse) {
  const rawUrl = req.url ?? '';
  const queryString = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?') + 1) : '';
  const params = new URLSearchParams(queryString);
  const url = params.get('url');

  if (!url) {
    res.writeHead(400).end('Missing url');
    return;
  }

  try {
    // Public hosts only, images only (favicons included, for the logo lookups).
    const { bytes, type } = await fetchImage(url, { allowIcon: true });
    res.writeHead(200, {
      'Content-Type': type,
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
      // An SVG opened on its own must not run script on this origin.
      'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; sandbox",
      'X-Content-Type-Options': 'nosniff',
    });
    res.end(bytes);
  } catch (err) {
    // Callers treat any non-OK answer as "no image" (the logo lookups rely on it).
    if (err instanceof ImageFetchError) res.writeHead(err.status).end(err.message);
    else res.writeHead(502).end('Proxy error');
  }
}
