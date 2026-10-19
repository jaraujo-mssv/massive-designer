// One rule for every campaign image in public/content/: WebP, no bigger than 1080p (1920×1080,
// or 1080×1920 standing up). Used by content:webp for what's already there and by content:photos
// for each new generation.
import { existsSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const LONG = 1920;
const SHORT = 1080;
const QUALITY = 82;
export const IMAGE = /\.(jpe?g|png|webp|avif|gif|tiff?|heic)$/i;

/**
 * What toWebp would do with `src`: null when it's already WebP at 1080p or under, else the
 * new path and size. `taken` is set when the .webp name is already used by another file.
 */
export async function webpPlan(src) {
  const { width, height } = await sharp(src).metadata();
  const scale = Math.min(1, LONG / Math.max(width, height), SHORT / Math.min(width, height));
  if (/\.webp$/i.test(src) && scale === 1) return null;
  const out = src.replace(/\.[^./]+$/, '.webp');
  return {
    out,
    taken: out !== src && existsSync(out),
    from: { width, height },
    to: { width: Math.round(width * scale), height: Math.round(height * scale) },
    before: statSync(src).size,
  };
}

/**
 * Re-encodes `src` as a 1080p WebP beside it and removes the original (it's in git history).
 * Returns the plan plus `after` (bytes), or null when the file is already fine or the name is
 * taken (`overwrite` replaces it instead, for a regeneration).
 */
export async function toWebp(src, { overwrite = false } = {}) {
  const plan = await webpPlan(src);
  if (!plan || (plan.taken && !overwrite)) return null;
  const buffer = await sharp(src).rotate().resize(plan.to.width, plan.to.height).webp({ quality: QUALITY, effort: 5 }).toBuffer();
  writeFileSync(plan.out, buffer);
  if (plan.out !== src) unlinkSync(src);
  return { ...plan, after: buffer.length };
}
