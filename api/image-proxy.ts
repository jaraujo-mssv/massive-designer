import type { IncomingMessage, ServerResponse } from 'node:http';

export default async function handler(req: IncomingMessage & { query?: Record<string, string> }, res: ServerResponse) {
  const rawUrl = req.url ?? '';
  const queryString = rawUrl.includes('?') ? rawUrl.slice(rawUrl.indexOf('?') + 1) : '';
  const params = new URLSearchParams(queryString);
  const url = params.get('url');

  if (!url) {
    res.writeHead(400).end('Missing url');
    return;
  }

  if (!/^https?:\/\//i.test(url)) {
    res.writeHead(400).end('Invalid url');
    return;
  }

  try {
    const upstream = await fetch(url);
    if (!upstream.ok) throw new Error(`Upstream responded with ${upstream.status}`);

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.writeHead(200, {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/png',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=86400',
    });
    res.end(buffer);
  } catch {
    res.writeHead(502).end('Proxy error');
  }
}
