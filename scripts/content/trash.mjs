// Keep a campaign's trash light: every image in public/content/<campaign>/photos/trash/ as WebP,
// no bigger than 1080p (1920×1080, or 1080×1920 standing up), with trash.md pointing at the .webp files.
//
//   npm run content:trash                  every campaign with a content/<campaign>/trash.md
//   npm run content:trash -- <campaign>    just that one
//   npm run content:trash -- --dry-run     show what would change
//
// To trash an image: drop it in photos/trash/ in any format (JPG, PNG, WebP …), list it in trash.md as
// `  Image: trash/<file>` under its item, then run this. Anything that isn't WebP yet, or is bigger than
// 1080p, is re-encoded (the original is removed, it's in git history), and its `Image:` line follows the
// new name. It also warns about images trash.md doesn't list and lines whose file is missing.
import { existsSync, readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const LONG = 1920;
const SHORT = 1080;
const QUALITY = 82;
const IMAGE = /\.(jpe?g|png|webp|avif|gif|tiff?|heic)$/i;

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const named = args.filter((a) => !a.startsWith('--'));
const campaigns = (named.length ? named : readdirSync(path.join(ROOT, 'content'))).filter((c) =>
  existsSync(path.join(ROOT, 'content', c, 'trash.md')),
);
if (!campaigns.length) {
  console.error(`[trash] no trash.md${named.length ? ` for ${named.join(', ')}` : ' in any campaign'}`);
  process.exit(1);
}

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;

for (const campaign of campaigns) {
  const docPath = path.join(ROOT, 'content', campaign, 'trash.md');
  const dir = path.join(ROOT, 'public/content', campaign, 'photos/trash');
  let doc = readFileSync(docPath, 'utf8');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => IMAGE.test(f)) : [];
  let before = 0;
  let after = 0;
  let changed = 0;

  for (const file of files) {
    const src = path.join(dir, file);
    const { width, height } = await sharp(src).metadata();
    const scale = Math.min(1, LONG / Math.max(width, height), SHORT / Math.min(width, height));
    if (/\.webp$/i.test(file) && scale === 1) continue;

    const name = file.replace(/\.[^.]+$/, '.webp');
    const out = path.join(dir, name);
    if (name !== file && existsSync(out)) {
      console.warn(`[trash] ${campaign}: skipping ${file}, ${name} already exists`);
      continue;
    }
    const w = Math.round(width * scale);
    const h = Math.round(height * scale);
    const size = statSync(src).size;
    changed++;
    before += size;
    if (dryRun) {
      console.log(`  ${file} ${width}×${height} → ${name} ${w}×${h}`);
      continue;
    }
    const buffer = await sharp(src).rotate().resize(w, h).webp({ quality: QUALITY, effort: 5 }).toBuffer();
    writeFileSync(out, buffer);
    if (name !== file) unlinkSync(src);
    after += buffer.length;
    // The doc's `Image: trash/<file>` follows the new name.
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    doc = doc.replace(new RegExp(`^(\\s+Image:\\s*trash/)${escaped}[ \\t]*$`, 'gm'), `$1${name}`);
    console.log(`  ${file} ${width}×${height} ${kb(size)} → ${name} ${w}×${h} ${kb(buffer.length)}`);
  }

  if (!dryRun) writeFileSync(docPath, doc);

  // Loose ends: images trash.md doesn't list, and lines whose image is gone.
  const listed = new Set([...doc.matchAll(/^\s+Image:\s*trash\/(\S+)/gm)].map((m) => m[1]));
  const onDisk = new Set(existsSync(dir) ? readdirSync(dir).filter((f) => IMAGE.test(f)) : []);
  for (const f of onDisk) if (!listed.has(f) && !dryRun) console.warn(`[trash] ${campaign}: ${f} isn't listed in trash.md`);
  for (const f of listed) if (!onDisk.has(f) && !dryRun) console.warn(`[trash] ${campaign}: trash.md lists ${f}, which isn't there`);

  console.log(
    changed
      ? `✓ ${campaign}: ${changed} image(s)${dryRun ? ' would be re-encoded' : `, ${kb(before)} → ${kb(after)}`}`
      : `✓ ${campaign}: all ${onDisk.size} trash images are WebP at 1080p or under`,
  );
}
