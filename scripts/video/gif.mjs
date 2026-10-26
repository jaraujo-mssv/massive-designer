// Render looping LinkedIn GIFs from HyperFrames projects with meta.json "output": "gif"
// (needs Node 22+, FFmpeg).
//
//   node scripts/video/gif.mjs <project-id...> [--colors=N] [--fps=N]
//   node scripts/video/gif.mjs --all
//
// 1. Capture: `hyperframes render --format png-sequence` writes the loop's frames to
//    output/gif/<id>-frames/ (frame i at t = i / fps, so t = duration is never captured).
// 2. Encode with FFmpeg (palettegen + paletteuse), stepping down LADDER in lib/gif-spec.mjs
//    until the GIF is under LinkedIn's 5 MB. --colors pins one palette size instead.
// 3. Check the GIF, then publish public/video-projects/<id>/gif/{<id>.gif, first-frame.jpg,
//    stats.json} and rebuild the Video tab's index. A failed render leaves the published GIF alone.
//
// Before any of that, the page must pass the mono rule (scripts/design/mono.mjs): monospace only for code.
import { spawnSync } from 'node:child_process';
import { copyFileSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
import { checkMono, formatMono } from '../design/mono.mjs';
import { LADDER, LIMITS, checks, mb, precheck } from './lib/gif-spec.mjs';
import { HF_VERSION, PROJECTS_DIR, ROOT, listProjects, pickProjects, readJson, readRoot } from './lib/projects.mjs';

const WORK_DIR = join(ROOT, 'output/gif');

const args = process.argv.slice(2);
const ids = args.filter((a) => !a.startsWith('--'));
const flag = (name) => args.find((a) => a.startsWith(`--${name}=`))?.split('=')[1];
const colors = flag('colors') && Number(flag('colors'));
const fpsOverride = flag('fps') && Number(flag('fps'));
const isGif = (id) => readJson(join(PROJECTS_DIR, id, 'meta.json'), {}).output === 'gif';

if (!ids.length && !args.includes('--all')) {
  console.error(`Usage: npm run gif:render <project-id...> | -- --all\nGIF projects: ${listProjects().filter(isGif).join(', ')}`);
  process.exit(1);
}
if (colors !== undefined && !(colors >= 2 && colors <= 256)) {
  console.error('--colors must be between 2 and 256.');
  process.exit(1);
}
if (Number(process.versions.node.split('.')[0]) < 22) {
  console.error(`HyperFrames needs Node 22+ (running ${process.version}). Run \`nvm use\` first.`);
  process.exit(1);
}

const targets = ids.length ? pickProjects(ids) : listProjects().filter(isGif);
const notGif = targets.filter((id) => !isGif(id));
if (notGif.length) {
  console.error(`Not GIF projects (meta.json "output": "gif"): ${notGif.join(', ')}. Use npm run video:render for videos.`);
  process.exit(1);
}

const run = (cmd, cmdArgs, cwd = ROOT) => spawnSync(cmd, cmdArgs, { cwd, stdio: 'inherit' }).status === 0;

run('node', ['scripts/video/sync-brand.mjs', ...targets]);
mkdirSync(WORK_DIR, { recursive: true });

// The mono rule: monospace only for code. A GIF that breaks it isn't rendered.
const monoProblems = await checkMono(targets.map((id) => `video-projects/${id}`));
if (Object.keys(monoProblems).length) {
  console.error(`✗ Monospace outside code (wrap real code in <code>/<pre> or .m-code; everything else is Outfit):\n${formatMono(monoProblems)}`);
}
const blocked = new Set(Object.keys(monoProblems).map((p) => p.split('/')[1]));

/** Two-pass FFmpeg encode of the PNG frames at one LADDER rung. */
function encode(framesDir, fps, rung, palette, output) {
  const input = ['-framerate', String(fps), '-start_number', '1', '-i', join(framesDir, 'frame_%06d.png')];
  const dither = rung.dither === 'bayer' ? 'bayer:bayer_scale=3' : rung.dither;
  return (
    run('ffmpeg', ['-v', 'error', '-y', ...input, '-vf', `palettegen=max_colors=${rung.colors}:stats_mode=full:reserve_transparent=0`, palette]) &&
    run('ffmpeg', ['-v', 'error', '-y', ...input, '-i', palette, '-lavfi', `[0:v][1:v]paletteuse=dither=${dither}:diff_mode=rectangle`, '-loop', '0', output])
  );
}

/** Bytes per second of the GIF, heaviest first: where to cut motion when it won't fit. */
function heaviestSeconds(file, fps) {
  const out = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v', '-show_entries', 'packet=size', '-of', 'csv=p=0', file], {
    encoding: 'utf8',
  }).stdout;
  const perSecond = new Map();
  out.trim().split('\n').forEach((size, i) => {
    const s = Math.floor(i / fps);
    perSecond.set(s, (perSecond.get(s) ?? 0) + Number(size));
  });
  return [...perSecond.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
}

/** Mean absolute difference between two small greyscale frames (0–255). */
const diff = (a, b) => {
  let sum = 0;
  for (let i = 0; i < a.length; i++) sum += Math.abs(a[i] - b[i]);
  return sum / a.length;
};

/**
 * Does the last frame flow into the first? The seam step (last → first) should look like the
 * steps either side of it (last-but-one → last, first → second), not like a cut.
 */
async function seamCheck(files) {
  const small = await Promise.all(files.map((f) => sharp(f).resize({ width: 240 }).greyscale().raw().toBuffer()));
  const n = small.length;
  const seam = diff(small[n - 1], small[0]);
  const around = Math.max(diff(small[n - 2], small[n - 1]), diff(small[0], small[1]));
  return { ok: seam <= 2 * around + 0.05, seam: Math.round(seam * 100) / 100, around: Math.round(around * 100) / 100 };
}

let failed = false;
let published = 0;
for (const id of targets) {
  const dir = join(PROJECTS_DIR, id);
  const meta = readJson(join(dir, 'meta.json'), {});
  const root = readRoot(readFileSync(join(dir, 'index.html'), 'utf8'));
  const fps = fpsOverride || root.fps;
  const { errors, warnings } = precheck({ ...root, fps });
  if (!meta.alt) warnings.push('meta.json has no "alt" text; LinkedIn posts need it.');
  console.log(`▶ ${id} (${root.width}×${root.height}, ${root.duration}s at ${fps} fps)`);
  for (const w of warnings) console.warn(`  ⚠ ${w}`);
  if (blocked.has(id)) errors.push('it uses monospace outside code (listed above).');
  if (errors.length) {
    for (const e of errors) console.error(`  ✗ ${e}`);
    failed = true;
    continue;
  }

  // 1. Capture.
  const framesDir = join(WORK_DIR, `${id}-frames`);
  if (!run('npx', ['--yes', `hyperframes@${HF_VERSION}`, 'render', '--format', 'png-sequence', '--fps', String(fps), '--quiet', '--output', framesDir], dir)) {
    console.error(`  ✗ ${id}: the HyperFrames capture failed.`);
    failed = true;
    continue;
  }
  const files = readdirSync(framesDir)
    .filter((f) => /^frame_\d{6}\.png$/.test(f))
    .sort()
    .map((f) => join(framesDir, f));
  const expected = Math.round(root.duration * fps);
  if (files.length !== expected) console.warn(`  ⚠ captured ${files.length} frames, expected ${expected}.`);

  // The capture makes html, body and the root transparent; the ground must be a child element.
  if (!(await sharp(files[0]).stats()).isOpaque) {
    console.error(
      `  ✗ ${id}: the frames are transparent. HyperFrames clears the background of html, body and the root\n` +
        '    composition when it captures a GIF; paint the ground on a full-bleed child (<div class="m-ground">).',
    );
    failed = true;
    continue;
  }

  // 2. Encode, stepping down the ladder until it fits.
  const palette = join(WORK_DIR, `${id}-palette.png`);
  const candidate = join(WORK_DIR, `${id}.gif`);
  let chosen = null;
  for (const rung of colors ? [{ colors, dither: 'sierra2_4a' }] : LADDER) {
    if (!encode(framesDir, fps, rung, palette, candidate)) break;
    const bytes = statSync(candidate).size;
    console.log(`  ${rung.colors} colours, ${rung.dither}: ${mb(bytes)}`);
    chosen = { ...rung, bytes };
    if (bytes <= LIMITS.maxBytes) break;
  }
  if (!chosen) {
    console.error(`  ✗ ${id}: FFmpeg couldn't encode the GIF.`);
    failed = true;
    continue;
  }
  if (chosen.bytes > LIMITS.maxBytes) {
    const heavy = heaviestSeconds(candidate, fps).map(([s, b]) => `${s}–${s + 1}s ${mb(b)}`).join(', ');
    console.error(
      `  ✗ ${id}: ${mb(chosen.bytes)} at the smallest setting, over LinkedIn's ${mb(LIMITS.maxBytes)}.\n` +
        `    Heaviest seconds: ${heavy}. Move less of the canvas, step motion instead of scrolling it,\n` +
        `    use flat fills on moving parts, or lower data-fps. Kept at ${candidate}; nothing published.`,
    );
    failed = true;
    continue;
  }

  // 3. Check and publish.
  const gifMeta = await sharp(candidate, { animated: true }).metadata();
  const seam = await seamCheck(files);
  if (!seam.ok) console.warn(`  ⚠ the loop jumps at the seam (step ${seam.seam} vs ${seam.around} either side).`);
  const stats = {
    bytes: chosen.bytes,
    frames: gifMeta.pages ?? files.length,
    fps,
    width: root.width,
    height: root.height,
    duration: root.duration,
    colors: chosen.colors,
    dither: chosen.dither,
    loop: gifMeta.loop ?? 0,
    renderedAt: new Date().toISOString(),
  };
  stats.checks = checks({ ...stats, seam });

  const outDir = join(dir, 'gif');
  mkdirSync(outDir, { recursive: true });
  copyFileSync(candidate, join(outDir, `${id}.gif`));
  // The still LinkedIn shows before the GIF plays: page 0 of the GIF, after quantizing.
  await sharp(candidate, { page: 0 }).jpeg({ quality: 90 }).toFile(join(outDir, 'first-frame.jpg'));
  writeFileSync(join(outDir, 'stats.json'), `${JSON.stringify(stats, null, 2)}\n`);
  published++;
  const bad = stats.checks.filter((c) => !c.ok).map((c) => c.label);
  console.log(
    `✓ ${id} → public/video-projects/${id}/gif/${id}.gif · ${mb(stats.bytes)} · ${stats.frames} frames · ${stats.colors} colours` +
      (bad.length ? ` · check: ${bad.join(', ')}` : ''),
  );
}

if (published) run('node', ['scripts/video/build-index.mjs']);
process.exit(failed ? 1 : 0);
