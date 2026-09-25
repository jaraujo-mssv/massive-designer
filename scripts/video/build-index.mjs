// Build public/video-projects/index.json, the catalogue the Video tool reads.
//
//   node scripts/video/build-index.mjs
//
// For each project it records meta.json, the root composition's size / fps /
// duration, the parsed STORYBOARD.md (with each frame's start time taken from
// the host clip that mounts its src), the raw SCRIPT.md and the untracked
// media the HTML references.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseStoryboard } from '@hyperframes/core/storyboard';
import { PROJECTS_DIR, listProjects, readJson } from './lib/projects.mjs';

const attr = (tag, name) => tag.match(new RegExp(`${name}="([^"]*)"`))?.[1];
const num = (v) => (v === undefined ? undefined : Number(v));

function readRoot(html) {
  const tag = html.match(/<div\b[^>]*data-composition-id="[^"]*"[^>]*>/)?.[0] ?? '';
  return {
    compositionId: attr(tag, 'data-composition-id'),
    width: num(attr(tag, 'data-width')) ?? 1920,
    height: num(attr(tag, 'data-height')) ?? 1080,
    fps: num(attr(tag, 'data-fps')) ?? 30,
    duration: num(attr(tag, 'data-duration')) ?? 0,
  };
}

/** Map of sub-composition src → host data-start (seconds). */
function hostStarts(html) {
  const starts = {};
  for (const tag of html.match(/<div\b[^>]*data-composition-src="[^"]*"[^>]*>/g) ?? []) {
    starts[attr(tag, 'data-composition-src')] = num(attr(tag, 'data-start')) ?? 0;
  }
  return starts;
}

/** Untracked media paths (assets/… outside the tracked assets/brand/ and assets/template/) referenced by the project's HTML. */
function mediaRefs(dir) {
  const files = [join(dir, 'index.html')];
  const comps = join(dir, 'compositions');
  if (existsSync(comps)) {
    for (const f of readdirSync(comps, { recursive: true })) {
      if (String(f).endsWith('.html')) files.push(join(comps, String(f)));
    }
  }
  const refs = new Set();
  for (const file of files) {
    for (const m of readFileSync(file, 'utf8').matchAll(/["'(]((?:\.\.\/)?assets\/[^"')\s]+)/g)) {
      const path = m[1].replace(/^\.\.\//, '');
      if (!/^assets\/(brand|template)\//.test(path)) refs.add(path);
    }
  }
  return [...refs].sort();
}

const projects = listProjects().map((id) => {
  const dir = join(PROJECTS_DIR, id);
  const meta = readJson(join(dir, 'meta.json'), {});
  const html = readFileSync(join(dir, 'index.html'), 'utf8');
  const root = readRoot(html);
  const starts = hostStarts(html);

  let storyboard = null;
  const boardPath = join(dir, 'STORYBOARD.md');
  if (existsSync(boardPath)) {
    const board = parseStoryboard(readFileSync(boardPath, 'utf8'));
    let cursor = 0;
    storyboard = {
      globals: board.globals,
      warnings: board.warnings,
      frames: board.frames.map((f) => {
        const start = f.src && f.src in starts ? starts[f.src] : cursor;
        cursor = start + (f.durationSeconds ?? 0);
        return {
          index: f.index,
          title: f.title ?? `Frame ${f.index}`,
          status: f.status,
          scene: f.scene ?? null,
          voiceover: f.voiceover ?? null,
          narrative: f.narrative ?? '',
          src: f.src ?? null,
          start,
          duration: f.durationSeconds ?? null,
          poster: f.poster ?? null,
          transitionIn: f.transitionIn ?? null,
        };
      }),
    };
  }

  const scriptPath = join(dir, 'SCRIPT.md');
  return {
    id,
    title: meta.name ?? id,
    group: meta.group ?? 'massive',
    kind: meta.kind ?? 'native',
    brand: meta.brand ?? null,
    status: meta.status ?? 'draft',
    source: meta.source ?? null,
    ...root,
    path: `/video-projects/${id}/index.html`,
    storyboard,
    script: existsSync(scriptPath) ? readFileSync(scriptPath, 'utf8') : null,
    media: mediaRefs(dir),
  };
});

writeFileSync(join(PROJECTS_DIR, 'index.json'), `${JSON.stringify({ projects }, null, 2)}\n`);
console.log(`✓ index.json · ${projects.length} project(s): ${projects.map((p) => p.id).join(', ')}`);
