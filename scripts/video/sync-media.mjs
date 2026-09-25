// Copy each project's untracked media from the sibling source repos.
//
//   node scripts/video/sync-media.mjs [project-id...]
//
// A project's media.json lists [{ "from": "<repo>/<path>", "to": "assets/<path>" }].
// <repo> resolves to $PLAYGROUND_DIR / $SPARKTRAY_DIR, or ../<repo> next to this repo.
// Media stays gitignored and out of the Vercel deploy; assets/.synced marks a
// complete copy so the Video tool knows the local preview has its media.
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
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
  for (const { from, to } of entries) {
    const src = sourcePath(from);
    if (!existsSync(src)) {
      missing.push(from);
      continue;
    }
    const dest = join(dir, to);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(src, dest);
  }
  if (missing.length) {
    failed = true;
    console.error(`✗ ${id}: ${missing.length} missing\n  ${missing.join('\n  ')}`);
  } else {
    mkdirSync(join(dir, 'assets'), { recursive: true });
    writeFileSync(join(dir, 'assets/.synced'), `${JSON.stringify({ files: entries.map((e) => e.to) }, null, 2)}\n`);
    console.log(`✓ ${id}: ${entries.length} file(s)`);
  }
}
process.exit(failed ? 1 : 0);
