// Build public/image-projects/index.json, the catalogue the Images tool reads.
//
//   node scripts/image/build-index.mjs
//
// For each project it records meta.json (title, group, series, size, fields …), the page URL and
// the thumbnail written by `npm run image:render`.
import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECTS_DIR, listProjects, readJson } from './lib/projects.mjs';

const projects = listProjects().map((id) => {
  const dir = join(PROJECTS_DIR, id);
  const meta = readJson(join(dir, 'meta.json'), {});
  return {
    id,
    title: meta.title ?? id,
    description: meta.description ?? null,
    group: meta.group ?? 'massive',
    series: meta.series ?? null,
    status: meta.status ?? 'draft',
    tags: meta.tags ?? [],
    source: meta.source ?? null,
    width: meta.width ?? 1080,
    height: meta.height ?? 1350,
    fields: meta.fields ?? [],
    path: `/image-projects/${id}/index.html`,
    thumb: existsSync(join(dir, 'thumb.jpg')) ? `/image-projects/${id}/thumb.jpg` : null,
  };
});

writeFileSync(join(PROJECTS_DIR, 'index.json'), `${JSON.stringify({ projects }, null, 2)}\n`);
console.log(`✓ index.json · ${projects.length} project(s): ${projects.map((p) => p.id).join(', ')}`);
