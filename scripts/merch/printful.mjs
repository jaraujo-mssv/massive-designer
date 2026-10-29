// The pajamas' print files for Printful: one JPG per placement of each garment, for each print and ground, in
// output/printful/<print>-<ground>/<garment>/<placement>.jpg (not committed: about 150 MB).
//
//   npm run merch:printful [-- mountain-dark sleepy-white …]
//
// A panel is the print's 1 m tile (public/merch-files/png/pajamas-<print>-<ground>-print.png, from `npm run merch`)
// repeated at actual size over the placement's exact pixel size at 150 dpi, unturned and unmirrored: Printful's
// templates stand each piece upright, so the print runs down the sleeves and legs. A label is the logo, centred on
// the ground. The garments and their placements are in src/tools/merch/app/printful.ts.
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PRINTFUL_DPI, PRINTFUL_GARMENTS } from "../../src/tools/merch/app/printful.ts";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const pngDir = resolve(repoRoot, "public", "merch-files", "png");
const outDir = resolve(repoRoot, "output", "printful");

const PRINTS = ["mountain", "sleepy"];
// The trim Printful offers is White or Black: piping in contrast to the ground, thread to match it
const GROUNDS = {
  dark: { color: "#0a0a0f", logo: "public/logo.svg", piping: "White", thread: "Black" },
  white: { color: "#ffffff", logo: "public/logo-positive.svg", piping: "Black", thread: "White" },
};

const sets = PRINTS.flatMap((print) => Object.keys(GROUNDS).map((ground) => ({ print, ground, id: `${print}-${ground}` })));
const only = process.argv.slice(2);
const unknown = only.filter((id) => !sets.some((set) => set.id === id));
if (unknown.length) {
  console.error(`[printful] no set named ${unknown.join(", ")}. Sets: ${sets.map((set) => set.id).join(", ")}`);
  process.exit(1);
}

const px = (inches) => Math.round(inches * PRINTFUL_DPI);
const slug = (name) => name.toLowerCase().replace(/\s+/g, "-");
const jpg = (image) => image.withIccProfile("srgb").withMetadata({ density: PRINTFUL_DPI }).jpeg({ quality: 90 }).toBuffer();

/** The tile repeated over W × H from its top-left corner, on the ground */
async function panel(tile, color, width, height) {
  const parts = [];
  for (let top = 0; top < height; top += tile.info.height) {
    for (let left = 0; left < width; left += tile.info.width) {
      const w = Math.min(tile.info.width, width - left);
      const h = Math.min(tile.info.height, height - top);
      const part = await sharp(tile.data, { raw: tile.info }).extract({ left: 0, top: 0, width: w, height: h }).raw().toBuffer();
      parts.push({ input: part, raw: { width: w, height: h, channels: tile.info.channels }, left, top });
    }
  }
  return jpg(sharp({ create: { width, height, channels: 3, background: color } }).composite(parts));
}

/** The logo, as large as fits in 80% of the label's width and half its height, centred on the ground */
async function label(ground, width, height) {
  const svg = await readFile(resolve(repoRoot, ground.logo));
  const logo = await sharp(svg, { density: 1200 })
    .trim()
    .resize({ width: Math.round(width * 0.8), height: Math.round(height * 0.5), fit: "inside" })
    .png()
    .toBuffer();
  return jpg(sharp({ create: { width, height, channels: 3, background: ground.color } }).composite([{ input: logo, gravity: "centre" }]));
}

let count = 0;
for (const set of sets.filter((set) => !only.length || only.includes(set.id))) {
  const ground = GROUNDS[set.ground];
  const tilePath = resolve(pngDir, `pajamas-${set.id}-print.png`);
  const tile = await sharp(tilePath).flatten({ background: ground.color }).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const setDir = resolve(outDir, set.id);
  await rm(setDir, { recursive: true, force: true });
  console.log(`\n${set.id} (from ${tilePath.slice(repoRoot.length + 1)})`);

  // One render per size: most garments use the same few
  const made = new Map();
  for (const garment of PRINTFUL_GARMENTS) {
    const dir = resolve(setDir, garment.id);
    await mkdir(dir, { recursive: true });
    const trim = ground[garment.trim];
    console.log(`  ${garment.name}: ${garment.url}`);
    console.log(`    ${garment.trim === "piping" ? "Trim" : "Thread"} colour: ${trim}`);
    for (const placement of garment.placements) {
      const width = px(placement.w);
      const height = px(placement.h);
      const key = `${placement.label ?? "panel"} ${width}×${height}`;
      if (!made.has(key)) made.set(key, placement.label ? label(ground, width, height) : panel(tile, ground.color, width, height));
      const file = resolve(dir, `${slug(placement.name)}.jpg`);
      await writeFile(file, await made.get(key));

      const meta = await sharp(file).metadata();
      if (meta.width !== width || meta.height !== height) throw new Error(`${file} is ${meta.width}×${meta.height}, not ${width}×${height}`);
      console.log(`    ${placement.name} → ${set.id}/${garment.id}/${slug(placement.name)}.jpg (${width} × ${height})`);
      count++;
    }
  }
}
console.log(`\nDone. ${count} files in ${outDir}`);
