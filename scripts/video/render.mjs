// Render HyperFrames projects to output/video/<id>.mp4 (needs Node 22+, FFmpeg).
//
//   node scripts/video/render.mjs <project-id...> [--draft]
//   node scripts/video/render.mjs --all [--draft]
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { HF_VERSION, OUTPUT_DIR, PROJECTS_DIR, ROOT, listProjects, pickProjects, readJson } from './lib/projects.mjs';

const args = process.argv.slice(2);
const draft = args.includes('--draft');
const ids = args.filter((a) => !a.startsWith('--'));
if (!ids.length && !args.includes('--all')) {
  console.error(`Usage: npm run video:render <project-id...> [--draft] | --all\nProjects: ${listProjects().join(', ')}`);
  process.exit(1);
}
if (Number(process.versions.node.split('.')[0]) < 22) {
  console.error(`HyperFrames needs Node 22+ (running ${process.version}). Run \`nvm use\` first.`);
  process.exit(1);
}

const run = (cmd, cmdArgs, cwd) => spawnSync(cmd, cmdArgs, { cwd, stdio: 'inherit' }).status === 0;

run('node', ['scripts/video/sync-brand.mjs', ...ids], ROOT);
mkdirSync(OUTPUT_DIR, { recursive: true });

let failed = false;
for (const id of pickProjects(ids)) {
  const dir = join(PROJECTS_DIR, id);
  const missing = readJson(join(dir, 'media.json'), []).filter(({ to }) => !existsSync(join(dir, to)));
  if (missing.length) {
    console.warn(`⚠ ${id}: ${missing.length} media file(s) missing; run \`npm run video:media ${id}\` first.`);
  }
  const output = join(OUTPUT_DIR, `${id}.mp4`);
  console.log(`▶ ${id} → ${output}`);
  const ok = run(
    'npx',
    ['--yes', `hyperframes@${HF_VERSION}`, 'render', '--quality', draft ? 'draft' : 'high', '--output', output],
    dir,
  );
  if (!ok) failed = true;
}
process.exit(failed ? 1 : 0);
