// GET /api/images?q=<words> searches the image projects; ?id=<id> describes one. Markdown as text/plain by default,
// since AI chats' fetch tools read text and HTML but not always JSON; ?format=json for JSON. Each image comes
// with its params and links (src/tools/images/params.ts); public/llms.txt is the same guide, prebuilt.
import { readFileSync } from 'node:fs';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { join } from 'node:path';
import { originOf } from './_lib/origin.js';
import {
  agentGuide,
  describeProject,
  editPath,
  listProject,
  renderPath,
  renderable,
  type DescribedProject,
} from '../src/tools/images/params.js';

/** Full descriptions for this many search results; the rest are one line each. */
const FULL = 8;

type Project = DescribedProject & { series: string | null; tags: string[] };

function load(): Project[] {
  const index = JSON.parse(readFileSync(join(process.cwd(), 'public/image-projects/index.json'), 'utf8'));
  return renderable(index.projects as Project[]);
}

/** Every word must appear in the title, id, description, tags, series or category (as the Library searches). */
const matches = (p: Project, terms: string[]) => {
  const hay = [p.title, p.id, p.description, p.series, p.category, ...(p.tags ?? [])].join(' ').toLowerCase();
  return terms.every((t) => hay.includes(t));
};

export default function handler(req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const base = originOf(req);
  const id = url.searchParams.get('id');
  const q = url.searchParams.get('q') ?? '';
  const json = url.searchParams.get('format') === 'json';

  const all = load();
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  const found = id ? all.filter((p) => p.id === id) : all.filter((p) => matches(p, terms));

  const send = (status: number, type: string, body: string) => {
    res.writeHead(status, {
      'Content-Type': `${type}; charset=utf-8`,
      'Cache-Control': 'public, max-age=300',
      'Access-Control-Allow-Origin': '*',
      'X-Robots-Tag': 'noindex',
    });
    res.end(body);
  };

  if (json) {
    const results = found.map((p) => ({
      id: p.id,
      title: p.title,
      description: p.description,
      kind: p.group === 'templates' ? 'template' : 'image',
      category: p.category,
      width: p.width,
      height: p.height,
      params: p.fields.map(({ id, type, label, default: value, options, hint }) => ({ name: id, type, label, default: value, options, hint })),
      image: `${base}${renderPath(p.id)}`,
      edit: `${base}${editPath(p.id)}`,
      thumb: `${base}/image-projects/${p.id}/thumb.jpg`,
    }));
    send(id && !found.length ? 404 : 200, 'application/json', `${JSON.stringify({ results }, null, 2)}\n`);
    return;
  }

  if (id) {
    if (!found.length) send(404, 'text/plain', `No image called "${id}". Every image: ${base}/llms.txt\n`);
    else send(200, 'text/plain', `${describeProject(found[0], base)}\n\n${agentGuide(base)}\n`);
    return;
  }

  const heading = terms.length ? `# Massive images matching "${q}": ${found.length}` : `# Massive images: ${found.length}`;
  const body = found.length
    ? [...found.slice(0, FULL).map((p) => describeProject(p, base)), ...(found.length > FULL ? [found.slice(FULL).map((p) => listProject(p, base)).join('\n')] : [])]
    : ['Nothing matched. Try fewer or other words, or see every image at ' + `${base}/llms.txt`];
  send(200, 'text/plain', `${[heading, ...body, agentGuide(base)].join('\n\n')}\n`);
}
