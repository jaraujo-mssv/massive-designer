// Build public/image-projects/index.json, the catalogue the Images tool reads.
//
//   node scripts/image/build-index.mjs
//
// For each project it records meta.json (title, category, template, series, status, size, fields …), the format
// and last update it derives, the page URL and the thumbnail written by `npm run image:render`. Planned entries
// from planned.json join them with status "planned" and no page yet. categories.json lists the themes, in the
// order the Library shows them. Unknown categories, templates or statuses are reported, not fatal.
//
// It also writes public/llms.txt: how an AI chat turns any of these images into a link that renders it
// (/api/render/<id>.jpg?…), every template's params in full and one line per other image. The wording and
// the link shapes are in src/tools/images/params.ts, shared with the API. Field ids that a link can't carry
// (the reserved names there) are reported.
import { existsSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { RESERVED_PARAMS, SITE_URL, agentGuide, describeProject, listProject, renderable } from '../../src/tools/images/params.ts';
import { PROJECTS_DIR, PUBLIC_DIR, listProjects, readJson } from './lib/projects.mjs';

const STATUSES = ['planned', 'draft', 'ready', 'posted'];
const SIZES = { portrait: [1080, 1350], square: [1080, 1080], landscape: [1920, 1080], story: [1080, 1920] };

const categories = readJson(join(PROJECTS_DIR, 'categories.json'), []);
const categoryIds = new Set(categories.map((c) => c.id));
const warnings = [];

/** The Library's format buckets, from the canvas size. */
function formatOf(w, h) {
  const r = w / h;
  if (Math.abs(r - 1) < 0.01) return 'square';
  if (Math.abs(r - 4 / 5) < 0.01) return 'portrait';
  if (Math.abs(r - 9 / 16) < 0.01) return 'story';
  if (Math.abs(r - 16 / 9) < 0.01) return 'landscape';
  return 'other';
}

/** Newest change to the page, its meta or its assets (not thumb.jpg, which every render rewrites). */
function updatedAt(dir) {
  let newest = 0;
  const walk = (d) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name !== 'thumb.jpg') newest = Math.max(newest, statSync(p).mtimeMs);
    }
  };
  walk(dir);
  return newest ? new Date(newest).toISOString() : null;
}

function statusOf(id, status) {
  if (status === undefined || STATUSES.includes(status)) return status ?? 'draft';
  warnings.push(`${id}: unknown status "${status}" (use ${STATUSES.join(', ')}); listed as draft`);
  return 'draft';
}

function checkCategory(id, category) {
  if (category && !categoryIds.has(category)) warnings.push(`${id}: unknown category "${category}" (see categories.json)`);
}

const projects = listProjects().map((id) => {
  const dir = join(PROJECTS_DIR, id);
  const meta = readJson(join(dir, 'meta.json'), {});
  const width = meta.width ?? 1080;
  const height = meta.height ?? 1350;
  checkCategory(id, meta.category);
  return {
    id,
    title: meta.title ?? id,
    description: meta.description ?? null,
    group: meta.group ?? 'massive',
    category: meta.category ?? null,
    template: meta.template ?? null,
    series: meta.series ?? null,
    status: statusOf(id, meta.status),
    tags: meta.tags ?? [],
    source: meta.source ?? null,
    width,
    height,
    format: formatOf(width, height),
    formats: null,
    updated: updatedAt(dir),
    brief: null,
    fields: meta.fields ?? [],
    path: `/image-projects/${id}/index.html`,
    thumb: existsSync(join(dir, 'thumb.jpg')) ? `/image-projects/${id}/thumb.jpg` : null,
  };
});

// A template is another project (normally a group "templates" one) or, for planned stills, "video:<id>"/"new".
const projectIds = new Set(projects.map((p) => p.id));
for (const p of projects) {
  if (p.template && !projectIds.has(p.template)) warnings.push(`${p.id}: template "${p.template}" is not a project`);
}

const planned = readJson(join(PROJECTS_DIR, 'planned.json'), []).map((item) => {
  if (projectIds.has(item.id)) warnings.push(`planned "${item.id}" has the same id as a project`);
  checkCategory(item.id, item.category);
  const t = item.template;
  if (t && t !== 'new' && !t.startsWith('video:') && !projectIds.has(t)) warnings.push(`planned "${item.id}": template "${t}" is not a project`);
  const formats = item.formats?.length ? item.formats : ['portrait'];
  const [width, height] = SIZES[formats[0]] ?? SIZES.portrait;
  return {
    id: item.id,
    title: item.title,
    description: item.brief ?? null,
    group: 'massive',
    category: item.category ?? null,
    template: t ?? null,
    series: item.series ?? null,
    status: 'planned',
    tags: item.tags ?? [],
    source: null,
    width,
    height,
    format: formats[0],
    formats,
    updated: null,
    brief: item.brief ?? null,
    fields: [],
    path: null,
    thumb: null,
  };
});

const all = [...projects, ...planned];
writeFileSync(join(PROJECTS_DIR, 'index.json'), `${JSON.stringify({ categories, projects: all }, null, 2)}\n`);

for (const p of projects) {
  for (const f of p.fields) {
    if (RESERVED_PARAMS.includes(f.id.toLowerCase())) warnings.push(`${p.id}: field "${f.id}" is a reserved URL name (${RESERVED_PARAMS.join(', ')}); links can't set it`);
  }
}

const live = renderable(projects);
const templates = live.filter((p) => p.group === 'templates');
const llms = [
  '# Massive Designer',
  '',
  "> Massive's on-brand images, made from a link: put the values in the URL and it returns the finished JPG. No sign-in, no key.",
  '',
  agentGuide(SITE_URL, templates.find((p) => p.id === 'blog-banner') ?? templates[0]),
  '',
  '## Templates',
  '',
  templates.map((p) => describeProject(p, SITE_URL)).join('\n\n'),
  '',
  '## Other images',
  '',
  "Finished designs, which can also be re-rendered with changes. Each link lists the image's params.",
  '',
  live.filter((p) => p.group !== 'templates').map((p) => listProject(p, SITE_URL)).join('\n'),
  '',
].join('\n');
writeFileSync(join(PUBLIC_DIR, 'llms.txt'), llms);
// AI chats' fetch tools refuse long URLs; the listed ones must stay fetchable.
for (const url of llms.match(/https:\/\/[^\s`)]+/g) ?? []) {
  if (url.length > 250) warnings.push(`llms.txt: a link is ${url.length} characters (fetch tools stop at 250): ${url.slice(0, 80)}…`);
}

const count = (key) =>
  Object.entries(all.reduce((acc, p) => ({ ...acc, [p[key] ?? '—']: (acc[p[key] ?? '—'] ?? 0) + 1 }), {}))
    .map(([k, n]) => `${k} ${n}`)
    .join(', ');
console.log(`✓ index.json · ${projects.length} project(s), ${planned.length} planned · llms.txt · ${templates.length} template(s)`);
console.log(`  by category: ${count('category')}`);
console.log(`  by status:   ${count('status')}`);
for (const w of warnings) console.warn(`  ! ${w}`);
