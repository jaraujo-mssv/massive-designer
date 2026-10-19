// Keep a campaign's images light: everything in public/content/<campaign>/photos/, photos/trash/ and
// refs/ as WebP, no bigger than 1080p (1920×1080, or 1080×1920 standing up), with the docs pointing
// at the .webp files.
//
//   npm run content:webp                  every campaign
//   npm run content:webp -- <campaign>    just that one
//   npm run content:webp -- --dry-run     show what would change
//
// (`npm run content:trash` runs this too.) Anything that isn't WebP yet, or is bigger than 1080p, is
// re-encoded (the original is removed, it's in git history), and every mention of its old name in
// content/<campaign>/**/*.md follows the new one: `Image:` and `Images:` lines, and people's and places'
// `refs:`. The prompts/ logs keep the names that were sent. To trash an image: drop it in photos/trash/
// in any format, list it in trash.md as `  Image: trash/<file>` under its item, then run this.
// It warns about trash images trash.md doesn't list, lines whose file is missing, and old names
// still mentioned in content/ or src/ (src/tools/content/app/utils/photoPrompt.ts names the logo refs).
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGE, toWebp, webpPlan } from './lib/webp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DIRS = ['photos', 'photos/trash', 'refs'];

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const named = args.filter((a) => !a.startsWith('--'));
const campaigns = (named.length ? named : readdirSync(path.join(ROOT, 'content'))).filter((c) =>
  existsSync(path.join(ROOT, 'public/content', c)),
);
if (!campaigns.length) {
  console.error(`[webp] no images in public/content/ for ${named.length ? named.join(', ') : 'any campaign'}`);
  process.exit(1);
}

const kb = (bytes) => `${Math.round(bytes / 1024)} KB`;
const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const nameRe = (file) => new RegExp(`(?<![\\w.-])${escape(file)}(?![\\w.-])`, 'g');
/** Every file under `dir` whose name passes `keep`. */
const walk = (dir, keep) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
        const p = path.join(dir, e.name);
        return e.isDirectory() ? walk(p, keep) : keep(e.name) ? [p] : [];
      })
    : [];

for (const campaign of campaigns) {
  const renames = new Map();
  let before = 0;
  let after = 0;
  let changed = 0;

  for (const sub of DIRS) {
    const dir = path.join(ROOT, 'public/content', campaign, sub);
    if (!existsSync(dir)) continue;
    for (const file of readdirSync(dir).filter((f) => IMAGE.test(f))) {
      const src = path.join(dir, file);
      const plan = dryRun ? await webpPlan(src) : await toWebp(src);
      if (!plan) {
        if (!dryRun && (await webpPlan(src))?.taken) console.warn(`[webp] ${campaign}: skipping ${sub}/${file}, its .webp already exists`);
        continue;
      }
      const name = path.basename(plan.out);
      const dims = `${plan.from.width}×${plan.from.height} → ${plan.to.width}×${plan.to.height}`;
      changed++;
      before += plan.before;
      if (dryRun) {
        console.log(`  ${sub}/${file} ${dims}${plan.taken ? ' (skipped: .webp exists)' : ''}`);
        continue;
      }
      after += plan.after;
      if (name !== file) renames.set(file, name);
      console.log(`  ${sub}/${file} ${kb(plan.before)} → ${name} ${dims} ${kb(plan.after)}`);
    }
  }

  // The docs follow the new names.
  const docsDir = path.join(ROOT, 'content', campaign);
  const docs = walk(docsDir, (f) => f.endsWith('.md'));
  if (renames.size) {
    for (const doc of docs) {
      const text = readFileSync(doc, 'utf8');
      let next = text;
      for (const [from, to] of renames) next = next.replace(nameRe(from), to);
      if (next !== text) writeFileSync(doc, next);
    }
  }

  if (!dryRun) {
    // Loose ends: trash images trash.md doesn't list, and lines whose image is gone.
    const trashDoc = path.join(docsDir, 'trash.md');
    const trashDir = path.join(ROOT, 'public/content', campaign, 'photos/trash');
    if (existsSync(trashDoc)) {
      const listed = new Set([...readFileSync(trashDoc, 'utf8').matchAll(/^\s+Image:\s*trash\/(\S+)/gm)].map((m) => m[1]));
      const onDisk = new Set(existsSync(trashDir) ? readdirSync(trashDir).filter((f) => IMAGE.test(f)) : []);
      for (const f of onDisk) if (!listed.has(f)) console.warn(`[webp] ${campaign}: ${f} isn't listed in trash.md`);
      for (const f of listed) if (!onDisk.has(f)) console.warn(`[webp] ${campaign}: trash.md lists ${f}, which isn't there`);
    }
    // Old names still mentioned anywhere that isn't a prompt log.
    const sources = [...docs, ...walk(path.join(ROOT, 'src'), (f) => /\.(tsx?|mjs|js|md)$/.test(f))];
    for (const [from] of renames)
      for (const file of sources)
        if (nameRe(from).test(readFileSync(file, 'utf8')))
          console.warn(`[webp] ${campaign}: ${path.relative(ROOT, file)} still names ${from}`);
  }

  console.log(
    changed
      ? `✓ ${campaign}: ${changed} image(s)${dryRun ? ' would be re-encoded' : `, ${kb(before)} → ${kb(after)}`}`
      : `✓ ${campaign}: every image is WebP at 1080p or under`,
  );
}
