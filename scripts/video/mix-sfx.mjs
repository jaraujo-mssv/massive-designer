// Pre-mix a template's UI sounds into one bed that spans the whole video.
//
//   node scripts/video/mix-sfx.mjs <project-id> [cue-sheet...]
//
// A cue sheet is assets/template/<name>.cues.json next to the bed it writes
// (assets/template/<name>.mp3). With no sheet named, every *.cues.json in the project's
// assets/template/ is mixed. Sheet shape:
//
//   { "duration": 16, "cues": [{ "file": "sfx/ping.mp3", "at": 8.4, "semitones": 2, "gain": 0.8, "trim": 0.28 }] }
//
// `file` is relative to assets/template/, `at` is seconds into the video, `semitones` repitches
// (and shortens) the clip, `gain` is linear, `trim` drops a lead-in. One bed instead of separate
// clips because the runtime freezes Firefox previews when a short clip ends inside its window.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECTS_DIR, pickProjects, readJson } from './lib/projects.mjs';

const [id, ...names] = process.argv.slice(2);
if (!id) {
  console.error('Usage: npm run video:sfx <project-id> [cue-sheet...]');
  process.exit(1);
}
pickProjects([id]);
const dir = join(PROJECTS_DIR, id, 'assets/template');
const sheets = names.length
  ? names.map((n) => (n.endsWith('.cues.json') ? n : `${n}.cues.json`))
  : readdirSync(dir).filter((f) => f.endsWith('.cues.json'));
if (!sheets.length) {
  console.error(`No *.cues.json in public/video-projects/${id}/assets/template.`);
  process.exit(1);
}

const RATE = 48000;
for (const sheet of sheets) {
  const { duration = 16, cues } = readJson(join(dir, sheet), {});
  const out = sheet.replace(/\.cues\.json$/, '.mp3');
  const inputs = [];
  const chains = cues.map((c, i) => {
    const src = join(dir, c.file);
    if (!existsSync(src)) {
      console.error(`${sheet}: missing ${c.file}`);
      process.exit(1);
    }
    inputs.push('-i', src);
    const f = [`aresample=${RATE}`, 'aformat=channel_layouts=stereo'];
    if (c.trim) f.push(`atrim=start=${c.trim}`, 'asetpts=PTS-STARTPTS');
    if (c.semitones) f.push(`asetrate=${Math.round(RATE * 2 ** (c.semitones / 12))}`, `aresample=${RATE}`);
    if (c.gain != null) f.push(`volume=${c.gain}`);
    const ms = Math.round(c.at * 1000);
    f.push(`adelay=${ms}|${ms}`);
    return `[${i}:a]${f.join(',')}[c${i}]`;
  });
  const graph = `${chains.join(';')};${cues.map((_, i) => `[c${i}]`).join('')}amix=inputs=${cues.length}:normalize=0,apad,atrim=0:${duration}[out]`;
  const r = spawnSync(
    'ffmpeg',
    ['-y', '-loglevel', 'error', ...inputs, '-filter_complex', graph, '-map', '[out]', '-ar', String(RATE), '-b:a', '192k', join(dir, out)],
    { stdio: 'inherit' },
  );
  if (r.status !== 0) process.exit(r.status ?? 1);
  console.log(`✓ ${id}/assets/template/${out} (${cues.length} cues, ${duration}s)`);
}
