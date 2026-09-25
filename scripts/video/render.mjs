// Render HyperFrames projects to output/video/<id>.mp4 (needs Node 22+, FFmpeg).
//
//   node scripts/video/render.mjs <project-id...> [--draft]
//   node scripts/video/render.mjs --all [--draft]
//   node scripts/video/render.mjs <project-id> --variables-file <path.json> [--name <out>]
//   node scripts/video/render.mjs <project-id> --variables '<json>' [--name <out>]
//
// Variable overrides render a template (e.g. welcome-to-massive) for someone else; --name
// sets the output file (output/video/<name>.mp4) so the default render isn't overwritten.
//
// Projects with "posterFromEnd": true in meta.json get their last frame copied over frame 0, so
// players and file browsers that thumbnail the first frame show the finished shot.
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
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

// Overwrite frame 0 with the last frame. Same length and audio, so nothing shifts.
function posterFromEnd(output) {
  const last = output.replace(/\.mp4$/, '.last.png');
  const tmp = output.replace(/\.mp4$/, '.poster.mp4');
  const ok =
    run('ffmpeg', ['-v', 'error', '-y', '-sseof', '-1', '-i', output, '-update', '1', last], ROOT) &&
    run(
      'ffmpeg',
      [
        '-v', 'error', '-y', '-i', output, '-i', last,
        '-filter_complex', '[0:v][1:v]overlay=enable=eq(n\\,0),format=yuv420p[v]',
        '-map', '[v]', '-map', '0:a?', '-c:a', 'copy',
        '-c:v', 'libx264', '-crf', draft ? '23' : '16', '-preset', draft ? 'veryfast' : 'slow',
        '-movflags', '+faststart', tmp,
      ],
      ROOT,
    );
  if (ok) renameSync(tmp, output);
  rmSync(last, { force: true });
  rmSync(tmp, { force: true });
  return ok;
}

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
  else if (readJson(join(dir, 'meta.json'), {}).posterFromEnd && !posterFromEnd(output)) {
    console.error(`✗ ${id}: couldn't copy the last frame to the start.`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
