// Refresh each project's media from the sibling source repos it was ported from.
//
//   node scripts/video/sync-media.mjs [project-id...]
//
// Media (voice takes, music, footage) is committed, so a clone already has it; this is only for
// pulling a newer copy from the source. A project's media.json lists [{ "from": "<repo>/<path>", "to": "assets/<path>" }].
// <repo> resolves to $PLAYGROUND_DIR / $SPARKTRAY_DIR, or ../<repo> next to this repo. An entry whose
// source isn't here keeps the committed file; it's missing only when neither exists.
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { PROJECTS_DIR, ROOT, pickProjects, readJson } from './lib/projects.mjs';

const REPO_DIRS = {
  'remotion-playground': process.env.PLAYGROUND_DIR,
  'sparktray-campaign': process.env.SPARKTRAY_DIR,
};

function sourcePath(from) {
  const [repo, ...rest] = from.split('/');
  const base = REPO_DIRS[repo] ?? resolve(ROOT, '..', repo);
  return join(base, ...rest);
}

let failed = false;
for (const id of pickProjects(process.argv.slice(2))) {
  const dir = join(PROJECTS_DIR, id);
  const entries = readJson(join(dir, 'media.json'), []);
  if (!entries.length) {
    console.log(`· ${id}: no media`);
    continue;
  }
  const missing = [];
  let copied = 0;
  for (const { from, to } of entries) {
    const src = from && sourcePath(from);
    const dest = join(dir, to);
    if (src && existsSync(src)) {
      mkdirSync(dirname(dest), { recursive: true });
      copyFileSync(src, dest);
      copied++;
    } else if (!existsSync(dest)) {
      missing.push(from ?? to);
    }
  }
  if (missing.length) {
    failed = true;
    console.error(`✗ ${id}: ${missing.length} missing\n  ${missing.join('\n  ')}`);
  } else {
    console.log(`✓ ${id}: ${entries.length} file(s)${copied ? `, ${copied} copied from source` : ''}`);
  }
}
process.exit(failed ? 1 : 0);
