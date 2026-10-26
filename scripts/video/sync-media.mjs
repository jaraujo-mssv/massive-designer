// Get each project's untracked media, or share a project's media with the team.
//
//   node scripts/video/sync-media.mjs [project-id...]           get what's missing (npm run video:media)
//   node scripts/video/sync-media.mjs --push <project-id...>    upload local media, record the URLs
//
// A project's media.json lists [{ "to": "assets/<path>", "url": "https://…", "from": "<repo>/<path>" }],
// `url` and `from` each optional. Getting: a file is copied from `from` when that sibling repo is here
// (<repo> resolves to $PLAYGROUND_DIR / $SPARKTRAY_DIR, or ../<repo> next to this repo), else kept if
// it's already on disk, else downloaded from `url` (public, no key needed).
// Pushing: uploads every file under assets/ except brand/ and template/ (those are tracked) to Vercel
// Blob and writes its `url` into media.json, so a clone can get it. Needs BLOB_READ_WRITE_TOKEN in the
// environment or .env. The URLs are public: push only media that's fine to publish.
// Media stays gitignored and out of the Vercel deploy; assets/.synced marks a complete copy so the
// Video tool knows the local preview has its media.
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { loadEnv } from '../content/lib/env.mjs';
import { PROJECTS_DIR, ROOT, pickProjects, readJson } from './lib/projects.mjs';

const REPO_DIRS = {
  'remotion-playground': process.env.PLAYGROUND_DIR,
  'sparktray-campaign': process.env.SPARKTRAY_DIR,
};
const TRACKED = ['brand', 'template'];

function sourcePath(from) {
  const [repo, ...rest] = from.split('/');
  const base = REPO_DIRS[repo] ?? resolve(ROOT, '..', repo);
  return join(base, ...rest);
}

/** Untracked files under a project's assets/, as `assets/…` paths. */
function localMedia(dir) {
  const assets = join(dir, 'assets');
  if (!existsSync(assets)) return [];
  return readdirSync(assets, { recursive: true, withFileTypes: true })
    .filter((d) => d.isFile() && !d.name.startsWith('.'))
    .map((d) => relative(dir, join(d.parentPath, d.name)))
    .filter((p) => !TRACKED.includes(p.split('/')[1]))
    .sort();
}

const args = process.argv.slice(2);
const PUSH = args.includes('--push');
const ids = args.filter((a) => !a.startsWith('--'));

if (PUSH) {
  loadEnv();
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!ids.length) {
    console.error('Usage: npm run video:media -- --push <project-id...>');
    process.exit(1);
  }
  if (!token) {
    console.error('BLOB_READ_WRITE_TOKEN is not set (in the environment or .env). Ask for it; see .env.example.');
    process.exit(1);
  }
  const { put } = await import('@vercel/blob');
  for (const id of pickProjects(ids)) {
    const dir = join(PROJECTS_DIR, id);
    const entries = readJson(join(dir, 'media.json'), []);
    const files = localMedia(dir);
    if (!files.length) {
      console.log(`· ${id}: no local media`);
      continue;
    }
    for (const to of files) {
      const blob = await put(`video-projects/${id}/${to}`, readFileSync(join(dir, to)), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        token,
      }).catch((err) => {
        console.error(`✗ ${id}: ${to} didn't upload: ${err.message}`);
        process.exit(1);
      });
      const entry = entries.find((e) => e.to === to);
      if (entry) entry.url = blob.url;
      else entries.push({ to, url: blob.url });
      console.log(`  ↑ ${to}`);
    }
    // One entry per line, like the hand-written files.
    const fields = (e) => Object.entries(e).map(([k, v]) => `${JSON.stringify(k)}: ${JSON.stringify(v)}`).join(', ');
    const lines = entries.map((e) => `  { ${fields(e)} }`).join(',\n');
    writeFileSync(join(dir, 'media.json'), `[\n${lines}\n]\n`);
    console.log(`✓ ${id}: ${files.length} file(s) uploaded, media.json updated (commit it)`);
  }
  process.exit(0);
}

let failed = false;
for (const id of pickProjects(ids)) {
  const dir = join(PROJECTS_DIR, id);
  const entries = readJson(join(dir, 'media.json'), []);
  if (!entries.length) {
    console.log(`· ${id}: no media`);
    continue;
  }
  const missing = [];
  let downloaded = 0;
  for (const { from, url, to } of entries) {
    const dest = join(dir, to);
    const src = from && sourcePath(from);
    mkdirSync(dirname(dest), { recursive: true });
    if (src && existsSync(src)) {
      copyFileSync(src, dest);
    } else if (existsSync(dest)) {
      continue;
    } else if (url) {
      const res = await fetch(url);
      if (!res.ok) {
        missing.push(`${to} (${res.status} from ${url})`);
        continue;
      }
      writeFileSync(dest, Buffer.from(await res.arrayBuffer()));
      downloaded++;
    } else {
      missing.push(from ?? to);
    }
  }
  if (missing.length) {
    failed = true;
    console.error(`✗ ${id}: ${missing.length} missing\n  ${missing.join('\n  ')}`);
  } else {
    writeFileSync(join(dir, 'assets/.synced'), `${JSON.stringify({ files: entries.map((e) => e.to) }, null, 2)}\n`);
    console.log(`✓ ${id}: ${entries.length} file(s)${downloaded ? `, ${downloaded} downloaded` : ''}`);
  }
}
process.exit(failed ? 1 : 0);
