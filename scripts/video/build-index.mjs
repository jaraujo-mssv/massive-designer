// Build public/video-projects/index.json, the catalogue the Video tool reads.
//
//   node scripts/video/build-index.mjs
//
// For each project it records meta.json, the root composition's size / fps /
// duration, the parsed STORYBOARD.md (with each frame's start time taken from
// the host clip that mounts its src), the raw SCRIPT.md and the untracked
// media the HTML references. GIF projects (meta.json "output": "gif") also get
// their alt text and, once rendered, gif/stats.json from `npm run gif:render`.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseStoryboard } from '@hyperframes/core/storyboard';
import { PROJECTS_DIR, attr, listProjects, num, readJson, readRoot } from './lib/projects.mjs';

/** Map of sub-composition src → host data-start (seconds). */
function hostStarts(html) {
  const starts = {};
  for (const tag of html.match(/<div\b[^>]*data-composition-src="[^"]*"[^>]*>/g) ?? []) {
    starts[attr(tag, 'data-composition-src')] = num(attr(tag, 'data-start')) ?? 0;
  }
  return starts;
}

/** Media paths (assets/… outside assets/brand/ and assets/template/) referenced by the project's HTML. */
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

/** The rendered GIF's stats and URLs (cache-busted by render time), or null before the first render. */
function gifInfo(id) {
  const stats = readJson(join(PROJECTS_DIR, id, 'gif', 'stats.json'), null);
  if (!stats) return null;
  const v = `?v=${encodeURIComponent(stats.renderedAt)}`;
  return {
    ...stats,
    url: `/video-projects/${id}/gif/${id}.gif${v}`,
    firstFrameUrl: `/video-projects/${id}/gif/first-frame.jpg${v}`,
  };
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
  const output = meta.output ?? 'mp4';
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
    output,
    series: meta.series ?? null,
    alt: meta.alt || null,
    gif: output === 'gif' ? gifInfo(id) : null,
  };
});

writeFileSync(join(PROJECTS_DIR, 'index.json'), `${JSON.stringify({ projects }, null, 2)}\n`);
console.log(`✓ index.json · ${projects.length} project(s): ${projects.map((p) => p.id).join(', ')}`);
