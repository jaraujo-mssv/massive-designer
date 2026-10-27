// GET /api/render/<id>.jpg?<field>=<value>&… → the image project rendered with those values, as a JPG.
// The link an AI chat hands its user (see public/llms.txt). Params follow src/tools/images/params.ts;
// `scale=1` gives 1× instead of 2×, `download=1` saves instead of showing. A link that isn't in canonical
// form (unknown params, defaults spelled out, "Strong" for strong, another order) is redirected to it, so
// the CDN caches each image once. Bad values get a plain-text answer for the person who clicked.
import type { IncomingMessage, ServerResponse } from 'node:http';
import { canonicalQuery, readParams, renderPath, type ParamField } from '../../src/tools/images/params.js';
import { originOf } from '../_lib/origin.js';
import { readMeta, renderImage } from '../_lib/render-image.js';
import { ImageFetchError, fetchImageDataUrl } from '../_lib/safe-fetch.js';

const FILE = /^([a-z0-9][a-z0-9-]*)(\.jpe?g)?$/;
const YES = ['1', 'true', 'yes'];

function text(res: ServerResponse, status: number, body: string) {
  res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
  res.end(`${body}\n`);
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const base = originOf(req);

  // The file name is the path's last segment (Vercel also passes it as ?id=).
  const fromPath = FILE.exec(decodeURIComponent(url.pathname.split('/').pop() ?? ''));
  const fromQuery = FILE.exec(url.searchParams.get('id') ?? '');
  const match = fromPath ?? fromQuery;
  const id = match?.[1];
  const meta = id ? readMeta(id) : null;
  if (!id || !meta) {
    text(res, 404, `There's no image called "${id ?? url.pathname}". The list is at ${base}/llms.txt`);
    return;
  }
  const fields = (meta.fields ?? []) as ParamField[];

  const params = new URLSearchParams(url.search);
  params.delete('id');
  const { values, errors } = readParams(fields, params);
  const problems = Object.entries(errors).map(([field, message]) => (message.startsWith(field) ? message : `${field}: ${message}`));
  if (problems.length) {
    text(res, 400, [...problems, '', `Every param for ${id}: ${base}/api/images?id=${id}`].join('\n'));
    return;
  }
  const scale = params.get('scale') === '1' ? 1 : 2;
  const download = YES.includes(params.get('download')?.toLowerCase() ?? '');

  // Compare decoded pairs, not strings, so a different encoding of the same link never loops.
  const canonical = [canonicalQuery(fields, values), scale === 1 ? 'scale=1' : '', download ? 'download=1' : '']
    .filter(Boolean)
    .join('&');
  const pairs = (p: URLSearchParams) => JSON.stringify([...p]);
  if (pairs(params) !== pairs(new URLSearchParams(canonical)) || (fromPath && fromPath[2] !== '.jpg')) {
    res.writeHead(308, { Location: `${renderPath(id)}${canonical ? `?${canonical}` : ''}`, 'Cache-Control': 'public, max-age=86400' });
    res.end();
    return;
  }

  try {
    // Photos from links are fetched here, checked, and inlined: the page itself can't reach the network.
    await Promise.all(
      fields
        .filter((f) => f.type === 'image' && typeof values[f.id] === 'string' && /^https?:/i.test(values[f.id] as string))
        .map(async (f) => {
          try {
            values[f.id] = await fetchImageDataUrl(values[f.id] as string);
          } catch (err) {
            if (err instanceof ImageFetchError) err.message = `${f.id}: ${err.message}`;
            throw err;
          }
        }),
    );
    const jpg = await renderImage({ id, width: meta.width ?? 1080, height: meta.height ?? 1350, scale, values });
    res.writeHead(200, {
      'Content-Type': 'image/jpeg',
      'Content-Length': jpg.length,
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${id}.jpg"`,
      // Browsers keep it a day; Vercel's CDN keeps it until the next deploy (each deploy has its own cache).
      'Cache-Control': 'public, max-age=86400',
      'Vercel-CDN-Cache-Control': 'max-age=2592000',
      'Vercel-Cache-Tag': `render,render-${id}`,
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'noindex',
    });
    res.end(jpg);
  } catch (err) {
    if (err instanceof ImageFetchError) {
      text(res, err.status, `${err.message}\n\nUse a direct link to the image file, or open the edit link and drop the photo in.`);
      return;
    }
    console.error(`render ${id} failed`, err);
    const reason = String((err as Error)?.message ?? err).split('\n')[0].slice(0, 200);
    text(res, 500, `Rendering ${id} failed (${reason}). Try again, or open ${base}/images?i=${id}`);
  }
}
