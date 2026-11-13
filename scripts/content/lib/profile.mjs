// Square profile-picture crops of a photo, framed like the team's own (head and shoulders, the
// face centred, cut around the neckline): macOS Vision finds the face (faces.swift), sharp crops.
// Used by scripts/content/photos.mjs for photos docs with `profiles: true`.
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const SWIFT = path.join(path.dirname(fileURLToPath(import.meta.url)), 'faces.swift');

/**
 * The framing, as shares of the square's side, measured on the team's own profile pictures
 * (four crops of the real shoot): Vision's face box is 0.445 of the side tall, centred 0.475
 * across, its top 0.30 down.
 */
const FACE = 0.445;
const CENTRE = 0.475;
const TOP = 0.3;
/** At least this much white above the top of the head (theirs have 11–16%), for big hair. */
const HEADROOM = 0.12;
/** The side of the JPG: theirs are 1070–1288 px. A smaller crop is scaled up to it. */
const SIZE = 1080;

/** The faces in each file, through one Swift run (it takes a few seconds to start). */
export function facesIn(files) {
  const out = execFileSync('swift', [SWIFT, ...files], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
  return out.trim().split('\n').map((l) => JSON.parse(l));
}

/** The biggest face Vision is sure of. */
const faceOf = ({ faces }) => [...(faces ?? [])].filter((f) => f.confidence > 0.5).sort((a, b) => b.w * b.h - a.w * a.h)[0];

/**
 * The top of the head: the first row above the face, across its width, that isn't the white
 * backdrop. Hair can rise well above Vision's face box, which starts around the brows.
 */
async function headTopOf(src, face, width) {
  const left = Math.max(0, Math.round(face.x));
  const band = Math.min(Math.round(face.w), width - left);
  const rows = Math.round(face.y);
  if (band < 1 || rows < 1) return face.y;
  const pixels = await sharp(src).rotate().extract({ left, top: 0, width: band, height: rows }).greyscale().raw().toBuffer();
  for (let y = 0; y < rows; y++) {
    let dark = 0;
    for (let x = 0; x < band; x++) if (pixels[y * band + x] < 230) dark++;
    if (dark > band * 0.04) return y;
  }
  return face.y;
}

/** The square to cut for a face, kept inside the image, with room above the head. */
export function squareFor({ width, height }, face, headTop = face.y) {
  const side = Math.round(Math.min(face.h / FACE, width, height));
  const clamp = (v, max) => Math.round(Math.max(0, Math.min(v, max)));
  const top = Math.min(face.y - TOP * side, headTop - HEADROOM * side);
  return {
    left: clamp(face.x + face.w / 2 - CENTRE * side, width - side),
    top: clamp(top, height - side),
    width: side,
    height: side,
  };
}

/** Writes a profile crop of each `{ src, out }` as a JPG. Returns each one's square, or its error. */
export async function profileCrops(pairs) {
  if (!pairs.length) return [];
  const found = facesIn(pairs.map((p) => p.src));
  const results = [];
  for (const [i, { src, out }] of pairs.entries()) {
    const face = found[i]?.error ? null : faceOf(found[i]);
    if (!face) {
      results.push({ src, out, error: found[i]?.error ?? 'no face found' });
      continue;
    }
    const box = squareFor(found[i], face, await headTopOf(src, face, found[i].width));
    mkdirSync(path.dirname(out), { recursive: true });
    await sharp(src)
      .rotate()
      .extract(box)
      .resize(Math.max(SIZE, box.width), Math.max(SIZE, box.width), { kernel: 'lanczos3' })
      .jpeg({ quality: 90, mozjpeg: true })
      .toFile(out);
    results.push({ src, out, box });
  }
  return results;
}
