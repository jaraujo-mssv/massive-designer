// Small previews for the Merch tab's sidebar, which shows a product's mockup, or its first design when it has none:
// - public/merch-files/thumbs/mockup-<id>.webp: each mockup (mockups/<id>.jpg), a 160 px square from its middle;
// - public/merch-files/thumbs/<file>.webp: each design's PNG fitted inside 160 × 160 on its transparent ground (the tab
//   draws the design's ground behind it, as its cards do).
// The PNGs are 300–600 dpi, megabytes each, and the mockups up to a megabyte: too heavy for a list that loads them all.
//
//   node scripts/merch/thumbs.mjs      (npm run merch runs it after its renders)
//
// Only a PNG newer than its thumbnail is redone.
import { mkdir, readdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const outDir = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..", "public", "merch-files");
const SIZE = 160;

const mtime = (path) => stat(path).then((s) => s.mtimeMs, () => 0);

export async function writeThumbs() {
  const pngDir = resolve(outDir, "png");
  const thumbDir = resolve(outDir, "thumbs");
  await mkdir(thumbDir, { recursive: true });
  let made = 0;
  for (const name of (await readdir(pngDir)).filter((f) => f.endsWith(".png"))) {
    const png = resolve(pngDir, name);
    const thumb = resolve(thumbDir, name.replace(/\.png$/, ".webp"));
    if ((await mtime(thumb)) >= (await mtime(png))) continue;
    // A pajama print is thousands of pixels a side: no limit on the input's size.
    await sharp(png, { limitInputPixels: false })
      .resize(SIZE, SIZE, { fit: "inside" })
      .webp({ quality: 82, alphaQuality: 90 })
      .toFile(thumb);
    made++;
  }
  const mockupDir = resolve(outDir, "mockups");
  for (const name of (await readdir(mockupDir).catch(() => [])).filter((f) => f.endsWith(".jpg"))) {
    const jpg = resolve(mockupDir, name);
    const thumb = resolve(thumbDir, `mockup-${name.replace(/\.jpg$/, ".webp")}`);
    if ((await mtime(thumb)) >= (await mtime(jpg))) continue;
    await sharp(jpg).resize(SIZE, SIZE, { fit: "cover", position: "centre" }).webp({ quality: 82 }).toFile(thumb);
    made++;
  }
  return made;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.log(`  ✓ ${await writeThumbs()} thumbnail(s) in ${resolve(outDir, "thumbs")}`);
}
