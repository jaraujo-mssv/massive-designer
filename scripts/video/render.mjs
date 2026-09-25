// Render HyperFrames projects to output/video/<id>.mp4 (needs Node 22+, FFmpeg).
//
//   node scripts/video/render.mjs <project-id...> [--draft]
//   node scripts/video/render.mjs --all [--draft]
//   node scripts/video/render.mjs <project-id> --variables-file <path.json> [--name <out>]
//   node scripts/video/render.mjs <project-id> --variables '<json>' [--name <out>]
//
// Variable overrides render a template (e.g. welcome-to-massive) for someone else; --name
// sets the output file (output/video/<name>.mp4) so the default render isn't overwritten.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { HF_VERSION, OUTPUT_DIR, PROJECTS_DIR, ROOT, listProjects, pickProjects, readJson } from './lib/projects.mjs';

const args = process.argv.slice(2);
const draft = args.includes('--draft');
// Flags that take a value: --variables, --variables-file, --name.
const valueOf = (flag) => {
  const i = args.indexOf(flag);
  return i === -1 ? undefined : args[i + 1];
};
const VALUE_FLAGS = ['--variables', '--variables-file', '--name'];
const ids = args.filter((a, i) => !a.startsWith('--') && !VALUE_FLAGS.includes(args[i - 1]));
const variables = valueOf('--variables');
const variablesFile = valueOf('--variables-file');
const outName = valueOf('--name');
if ((variables || variablesFile || outName) && ids.length !== 1) {
  console.error('--variables, --variables-file and --name need exactly one project id.');
  process.exit(1);
}
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
  const output = join(OUTPUT_DIR, `${outName ?? id}.mp4`);
  console.log(`▶ ${id} → ${output}`);
  const extra = [];
  if (variables) extra.push('--variables', variables);
  if (variablesFile) extra.push('--variables-file', resolve(ROOT, variablesFile));
  const ok = run(
    'npx',
    ['--yes', `hyperframes@${HF_VERSION}`, 'render', '--quality', draft ? 'draft' : 'high', '--output', output, ...extra],
    dir,
  );
  if (!ok) failed = true;
}
process.exit(failed ? 1 : 0);
