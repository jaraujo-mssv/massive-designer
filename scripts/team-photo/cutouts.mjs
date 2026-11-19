// The Team Photo tab's faces: for each teammate, a square head-and-shoulders crop with the
// backdrop cut away, as a transparent WebP in public/team-photo/, plus team.json listing them.
//
//   npm run team-photo:cutouts
//
// Whose photo:
// - The photo picked for each teammate in the team shoot (content/team-shoot/photos.md, every
//   item's `Image:`).
// - A better photo wins: a portrait in public/content/team-shoot/originals/profiles/, named after
//   the teammate (`melanie-opena.jpg` for Melanie Opeña), replaces their pick. One named after
//   nobody in the shoot adds them (`marco-spagnuolo.jpg` is Marco Spagnuolo).
// - Someone with no photo yet gets a placeholder (NO_PHOTO_YET), until a photo named after them
//   comes in.
//
// Hand edits (a better mask round the hair, say) are kept: save the edited cut-out in
// public/team-photo/edited/ under the same name (`profile-michael.webp`, or .png), and it's used as
// it is instead of the automatic one, run after run. An edit saved over the cut-out itself is
// caught too (it no longer matches what the last run wrote) and moved into edited/ first. An edit
// lasts as long as that photo is the one used: a new take or a better photo gets a fresh cut-out.
//
// The framing shows the Massive T-shirt under the face: every face the same size, the eyes level
// from tile to tile (FACE, TOP). So each photo has to reach well below the shoulders: a headshot
// cut at the collar is framed tighter than the rest, and the run says so.
//
// How: Vision finds the face (lib/faces.swift, through lib/profile.mjs) and outlines the person
// (lib/cutout.swift); then matte.py works the hair out
// strand by strand from the photo itself (alpha matting, guided by that outline). matte.py runs
// through uv (`brew install uv`), which fetches its pinned Python libraries into its own cache, so
// nothing is added to the project. Without uv, a plainer clean-up of Vision's outline is used.
// macOS only, free, no key; about 2 s a photo. Rerun it after picking another take or adding
// photos. The files are committed: the live tab serves them.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { faceOf, facesIn } from '../content/lib/profile.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DOC = path.join(ROOT, 'content/team-shoot/photos.md');
const SHOOT = path.join(ROOT, 'public/content/team-shoot');
const PROFILES = path.join(SHOOT, 'originals/profiles');
const OUT = path.join(ROOT, 'public/team-photo');
const EDITED = path.join(OUT, 'edited');
const CUTOUT_SWIFT = path.join(ROOT, 'scripts/content/lib/cutout.swift');
const MATTE_PY = path.join(ROOT, 'scripts/team-photo/matte.py');
/** The side of each WebP, as the profile crops. */
const SIZE = 1080;
/** Without matting: how close to the backdrop's colour (0–255, in the furthest channel) a pixel near the edge is backdrop. */
const KEY = 24;
/**
 * The framing, as shares of the square's side (José's pick of the options tried, 2026-11-19):
 * Vision's face box is 0.34 of the side tall, centred across, its top 0.28 down, which leaves the
 * top of the T-shirt's logo in the frame. Hair and hats keep at least HEADROOM above them.
 */
const FACE = 0.34;
const TOP = 0.28;
const HEADROOM = 0.03;

/**
 * The names shown are José's (2026-11-19), else the landing site's roster. The real shoot's photos
 * are labelled by pose, not name: these were matched to José's named profile crops of the same shoot.
 */
const REAL_NAMES = {
  'real-dsc08009': 'Jason Grad',
  'real-dsc08033': 'Vova Rudenko',
  'real-dsc08049': 'Ilya Yermolovich',
  'real-dsc08075': 'Sam Ostrovskyi',
  'real-dsc08085': 'Gianni Massi',
  'real-dsc08140': 'Alexandr Alokhin',
  'real-dsc08212': 'Artem Shcherbatiuk',
  'real-dsc08245': 'Michael Oyenira',
};

/** Teammates whose name in photos.md (the shoot's own label) isn't the one to show. */
const RENAMES = {
  Josh: 'Josh Korol',
  'Beverly Cabanero': 'Bev Cabañero',
  'Oreoluwa Emmanuel': 'Emmanuel Oreoluwa',
};

/** Teammates with no photo yet: a placeholder each. */
const NO_PHOTO_YET = ['Dima Tymoshchenko', 'Morvi Chaturvedi', 'Monika Dainyte', 'Mohie Eddine Lakhdar'];

const stem = (file) => file.replace(/\.\w+$/, '');
const slug = (s) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
/** `valentyn-naboka` → Valentyn Naboka, for a better photo of someone not in the shoot. */
const nameOf = (s) => s.split('-').map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');

/** Every item's picked photo and, for generated teammates, the name in its `**Name:**` label. */
function picked(raw) {
  const out = [];
  let label = '';
  for (const line of raw.split('\n')) {
    const item = line.match(/^- \[[ xX]\] (.+)$/);
    if (item) label = item[1].trim();
    const image = line.match(/^\s+Image:\s*(\S+)/);
    if (!image) continue;
    const id = stem(image[1]);
    const labelled = label.match(/^\*\*(.+?):\*\*/)?.[1];
    const name = (labelled && (RENAMES[labelled] ?? labelled)) ?? REAL_NAMES[id];
    // The real eight from the 2400 px originals, the generated ones from their 1440 px WebPs.
    const src = id.startsWith('real-')
      ? path.join(SHOOT, 'originals/shoot', `${id.replace(/^real-/, '')}.jpg`)
      : path.join(SHOOT, 'photos', image[1]);
    out.push({ id, name, src });
  }
  return out;
}

/** The picks, each replaced by the better photo named after them, if there is one, and the people only those add. */
function withProfiles(people) {
  const out = [...people];
  for (const file of readdirSync(PROFILES).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort()) {
    const s = stem(file);
    const better = { id: `profile-${s}`, src: path.join(PROFILES, file) };
    const i = out.findIndex((p) => p.name && slug(p.name) === s);
    if (i >= 0) out[i] = { ...better, name: out[i].name };
    else out.push({ ...better, name: nameOf(s) });
  }
  return out;
}

/**
 * The top of the head: the first row above the face, across its width, that the mask covers.
 * Hair and hats rise well above Vision's face box, which starts around the brows.
 */
function headTopOf(mask, face) {
  const bytes = readFileSync(mask.mask);
  const left = Math.max(0, Math.round(face.x));
  const right = Math.min(mask.width, Math.round(face.x + face.w));
  for (let y = 0; y < Math.round(face.y); y++) {
    let covered = 0;
    for (let x = left; x < right; x++) if (bytes[y * mask.width + x] > 128) covered++;
    if (covered > (right - left) * 0.04) return y;
  }
  return face.y;
}

/**
 * The square for a face, kept inside the photo. `tight` says how it falls short of the framing,
 * when the photo is too small for it (framed tighter) or ends too close to the face (moved).
 */
function frameFor({ width, height }, face, headTop) {
  const wanted = face.h / FACE;
  const side = Math.round(Math.min(wanted, width, height));
  const left = face.x + face.w / 2 - side / 2;
  const top = Math.min(face.y - TOP * side, headTop - HEADROOM * side);
  const clamp = (v, max) => Math.round(Math.max(0, Math.min(v, max)));
  const box = { left: clamp(left, width - side), top: clamp(top, height - side), width: side, height: side };
  const moved = Math.max(Math.abs(box.left - left), Math.abs(box.top - top)) / side;
  const tight =
    side < wanted * 0.98
      ? `framed tighter than the rest (the photo is ${Math.round((side / wanted) * 100)}% of the square it needs)`
      : moved > 0.02
        ? `moved ${Math.round(moved * 100)}% of the side to stay in the photo`
        : '';
  return { box, tight };
}

/** The person's mask for each photo, through one Swift run. */
function masksFor(people, dir) {
  const args = people.flatMap((p) => [p.src, path.join(dir, `${p.id}.gray`)]);
  const out = execFileSync('swift', [CUTOUT_SWIFT, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return out.trim().split('\n').map((l) => JSON.parse(l));
}

/** The crop and Vision's mask of it, at SIZE, as the PNGs matte.py reads: <id>-rgb.png and <id>-alpha.png. */
async function cropFor(p, mask, box, dir) {
  await sharp(p.src).rotate().removeAlpha().extract(box).resize(SIZE, SIZE, { kernel: 'lanczos3' }).png().toFile(path.join(dir, `${p.id}-rgb.png`));
  await sharp(readFileSync(mask.mask), { raw: { width: mask.width, height: mask.height, channels: 1 } })
    .extract(box)
    .resize(SIZE, SIZE, { kernel: 'lanczos3' })
    .extractChannel(0)
    .png()
    .toFile(path.join(dir, `${p.id}-alpha.png`));
}

/** The alpha matte of each crop in `dir` (<id>-matte.png), through one matte.py run: id → result. Null without uv. */
function mattesFor(ids, dir) {
  if (!ids.length) return new Map();
  try {
    const out = execFileSync('uv', ['run', '--quiet', '--script', MATTE_PY, dir, ...ids], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return new Map(
      out
        .trim()
        .split('\n')
        .filter((l) => l.startsWith('{'))
        .map((l) => JSON.parse(l))
        .map((r) => [r.id, r]),
    );
  } catch (e) {
    const why = e.code === 'ENOENT' ? 'uv isn\'t installed: brew install uv' : String(e.stderr || e.message).trim().split('\n').pop();
    console.log(`[team-photo] ! no matting (${why}), so the plainer clean-up`);
    return null;
  }
}

/** Without matting: the backdrop's colour, the average of the pixels the mask leaves out (white if it leaves out almost none). */
function backdropOf(rgb, alpha) {
  const sum = [0, 0, 0];
  let n = 0;
  for (let i = 0; i < alpha.length; i++) {
    if (alpha[i] > 8) continue;
    for (let c = 0; c < 3; c++) sum[c] += rgb[i * 3 + c];
    n++;
  }
  return n > alpha.length * 0.01 ? sum.map((v) => v / n) : [255, 255, 255];
}

/**
 * Without matting: the photo and its mask cropped alike, the mask as alpha, cleaned up at the
 * edges, where it meets the backdrop (white in the shoot, grey or coloured in others, so its colour
 * is measured where the mask is empty):
 * - Near the mask's edge, backdrop that Vision kept (between locs, a rim round a bald head) is
 *   keyed out.
 * - Edge pixels are a blend of the person and the backdrop, so they're unmixed from it, or a
 *   light halo would show round the hair on a coloured ground.
 */
async function plainCutout(src, mask, box) {
  const size = Math.max(SIZE, box.width);
  const rgb = await sharp(src).rotate().removeAlpha().extract(box).resize(size, size, { kernel: 'lanczos3' }).raw().toBuffer();
  const alpha = await sharp(readFileSync(mask.mask), { raw: { width: mask.width, height: mask.height, channels: 1 } })
    .extract(box)
    .resize(size, size, { kernel: 'lanczos3' })
    // One channel out, as it came in (sharp would otherwise widen it to sRGB).
    .extractChannel(0)
    .raw()
    .toBuffer();
  // The band along the mask's edge, about 2% of the side deep: where the blurred mask isn't solid.
  const near = await sharp(alpha, { raw: { width: size, height: size, channels: 1 } })
    .blur(size * 0.02)
    .extractChannel(0)
    .raw()
    .toBuffer();
  const backdrop = backdropOf(rgb, alpha);
  const rgba = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    if (near[i] < 250) {
      const d = Math.max(...backdrop.map((v, c) => Math.abs(rgb[i * 3 + c] - v)));
      if (d < KEY) alpha[i] = Math.round((alpha[i] * d) / KEY);
    }
    const a = alpha[i] / 255;
    for (let c = 0; c < 3; c++) {
      const v = rgb[i * 3 + c];
      rgba[i * 4 + c] = a > 0.05 && a < 1 ? Math.max(0, Math.min(255, Math.round((v - (1 - a) * backdrop[c]) / a))) : v;
    }
    rgba[i * 4 + 3] = alpha[i];
  }
  return sharp(rgba, { raw: { width: size, height: size, channels: 4 } })
    .resize(SIZE, SIZE, { kernel: 'lanczos3' })
    .webp({ quality: 88, alphaQuality: 95 });
}

const hashOf = (file) => createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 12);

/** Each cut-out's hash as the last run wrote it, from team.json's `made`. */
function lastMade() {
  try {
    return Object.fromEntries(JSON.parse(readFileSync(path.join(OUT, 'team.json'), 'utf8')).map((p) => [p.id, p.made]));
  } catch {
    return {};
  }
}

/** A cut-out that changed since the last run was edited by hand: it goes to edited/ before anything overwrites it. */
function keepEditsInPlace(people) {
  const made = lastMade();
  for (const { id } of people) {
    const file = path.join(OUT, `${id}.webp`);
    if (!made[id] || !existsSync(file) || hashOf(file) === made[id]) continue;
    mkdirSync(EDITED, { recursive: true });
    copyFileSync(file, path.join(EDITED, `${id}.webp`));
    console.log(`[team-photo] ${id}.webp was edited by hand: kept as edited/${id}.webp`);
  }
}

/** The hand-edited cut-out of a photo, if there is one. */
const editedOf = (id) => ['webp', 'png'].map((ext) => path.join(EDITED, `${id}.${ext}`)).find((f) => existsSync(f));

/** Serves an edit: as it is when it's already a 1080 px square WebP, else converted to one. */
async function useEdit(src, out) {
  const { format, width, height } = await sharp(src).metadata();
  if (format === 'webp' && width === SIZE && height === SIZE) return copyFileSync(src, out);
  await sharp(src)
    .resize(SIZE, SIZE, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .webp({ quality: 88, alphaQuality: 95 })
    .toFile(out);
}

/** A placeholder for each teammate with no photo yet. */
function withPlaceholders(people) {
  const named = new Set(people.map((p) => p.name && slug(p.name)));
  const missing = NO_PHOTO_YET.filter((name) => !named.has(slug(name)));
  return [...people, ...missing.map((name) => ({ id: `placeholder-${slug(name)}`, name, placeholder: true }))];
}

const everyone = withPlaceholders(withProfiles(picked(readFileSync(DOC, 'utf8'))));
const people = everyone.filter((p) => !p.placeholder);
const better = people.filter((p) => p.id.startsWith('profile-')).length;
console.log(
  `[team-photo] ${everyone.length} people: ${people.length - better} picked in content/team-shoot/photos.md, ${better} better photos from originals/profiles/, ${everyone.length - people.length} with no photo yet`,
);

mkdirSync(OUT, { recursive: true });
keepEditsInPlace(people);
const work = mkdtempSync(path.join(tmpdir(), 'team-photo-'));
try {
  // Vision only for the photos without an edit.
  const auto = people.filter((p) => !editedOf(p.id));
  const faces = auto.length ? facesIn(auto.map((p) => p.src)) : [];
  const masks = auto.length ? masksFor(auto, work) : [];
  // Each photo's square, and its crop for the matting.
  const boxes = new Map();
  for (const [i, p] of auto.entries()) {
    const face = faces[i]?.error ? null : faceOf(faces[i]);
    const mask = masks[i];
    if (!face || mask?.error) {
      console.log(`[team-photo] ✗ ${p.id}: ${faces[i]?.error ?? mask?.error ?? 'no face found'}`);
      continue;
    }
    const { box, tight } = frameFor(faces[i], face, headTopOf(mask, face));
    boxes.set(p.id, { box, mask, tight });
    await cropFor(p, mask, box, work);
  }
  const mattes = mattesFor([...boxes.keys()], work);
  const made = [];
  for (const p of people) {
    const out = path.join(OUT, `${p.id}.webp`);
    const label = `${p.id}.webp${p.name ? ` (${p.name})` : ''}`;
    const edit = editedOf(p.id);
    if (edit) {
      await useEdit(edit, out);
      console.log(`[team-photo] ✓ ${label}, your edit from edited/${path.basename(edit)}`);
    } else {
      if (!boxes.has(p.id)) continue;
      const { box, mask, tight } = boxes.get(p.id);
      const matte = mattes?.get(p.id);
      if (matte?.ok) await sharp(path.join(work, `${p.id}-matte.png`)).webp({ quality: 88, alphaQuality: 95 }).toFile(out);
      else await (await plainCutout(p.src, mask, box)).toFile(out);
      const how = matte?.ok ? 'matted' : `plain clean-up${matte?.error ? ` (matting failed: ${matte.error})` : ''}`;
      console.log(`[team-photo] ✓ ${label}, ${how}, from a ${box.width} px square${tight ? `, ! ${tight}` : ''}`);
    }
    made.push({ id: p.id, ...(p.name ? { name: p.name } : {}), src: `/team-photo/${p.id}.webp`, made: hashOf(out) });
  }
  for (const p of everyone.filter((p) => p.placeholder)) {
    made.push({ id: p.id, name: p.name, placeholder: true });
    console.log(`[team-photo] · ${p.name}: no photo yet, a placeholder`);
  }
  // Edits of photos no longer used: kept, but say so.
  const ids = new Set(people.map((p) => p.id));
  for (const file of existsSync(EDITED) ? readdirSync(EDITED) : []) {
    if (/\.(webp|png)$/.test(file) && !ids.has(stem(file))) console.log(`[team-photo] ! edited/${file} isn't used: no one's photo is ${stem(file)} any more`);
  }
  // By name, the unnamed last, in the doc's order.
  made.sort((a, b) => (a.name ? 0 : 1) - (b.name ? 0 : 1) || (a.name && b.name ? a.name.localeCompare(b.name) : 0));
  writeFileSync(path.join(OUT, 'team.json'), `${JSON.stringify(made, null, 2)}\n`);
  // Cut-outs of takes no longer picked, or replaced by a better photo.
  const keep = new Set(people.map((p) => `${p.id}.webp`));
  for (const file of readdirSync(OUT)) if (file.endsWith('.webp') && !keep.has(file)) rmSync(path.join(OUT, file));
  console.log(`[team-photo] wrote public/team-photo/team.json (${made.length} people)`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
