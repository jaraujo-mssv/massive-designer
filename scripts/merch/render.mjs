import { chromium } from "playwright";
import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import sharp from "sharp";
import { writeCmykPdf } from "./cmyk-pdf.mjs";
import { writeThumbs } from "./thumbs.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
// public/, not output/: the Merch tab serves these on the live site.
const outDir = resolve(repoRoot, "public", "merch-files");

//   node scripts/merch/render.mjs [<name>]     (npm run merch -- card)
// merch.html is the proof sheet. Each [data-file] in it is one design, also printed on its own at its own size.
// With a name, only the designs whose file starts with it are rendered, so the others' files stay as they are.
const only = process.argv[2];
await mkdir(resolve(outDir, "pdf"), { recursive: true });
await mkdir(resolve(outDir, "png"), { recursive: true });
await mkdir(resolve(outDir, "svg"), { recursive: true });

// The sticker SVGs are print-ready as they are: they go up as downloads next to their PDFs.
for (const file of await readdir(resolve(__dirname, "stickers"))) {
  await copyFile(resolve(__dirname, "stickers", file), resolve(outDir, "svg", file));
}

const browser = await chromium.launch();
// The PNGs are 600 dpi, or a design's data-dpi (a pajama print is a metre wide): one page per resolution, as
// deviceScaleFactor is set per context.
const pages = new Map();
async function pageAt(dpi) {
  if (!pages.has(dpi)) {
    const ctx = await browser.newContext({ viewport: { width: 1056, height: 816 }, deviceScaleFactor: dpi / 96 });
    const page = await ctx.newPage();
    // goto (not setContent) so the page loads as a file, like the other pipelines
    await page.goto(pathToFileURL(resolve(__dirname, "merch.html")).href, { waitUntil: "networkidle" });
    await page.evaluate(() => Promise.all([document.fonts.ready, ...[...document.images, ...document.querySelectorAll("image")].map((img) => img.decode())]));
    pages.set(dpi, page);
  }
  return pages.get(dpi);
}
const page = await pageAt(600);

const noMargin = { top: 0, right: 0, bottom: 0, left: 0 };
const proofPath = resolve(outDir, "massive-merch-proof.pdf");
await page.pdf({ path: proofPath, format: "Letter", landscape: true, printBackground: true, margin: noMargin });
console.log(`  ✓ proof → ${proofPath}`);

const files = (await page.$$eval(".art[data-file]", (els) => els.map((el) => [el.dataset.file, Number(el.dataset.dpi ?? 600)]))).filter(
  ([file]) => !only || file.startsWith(only),
);
for (const [file, dpi] of files) {
  const page = await pageAt(dpi);
  const art = page.locator(`[data-file="${file}"]`);
  await page.evaluate((f) => {
    document.documentElement.dataset.only = f;
    document.querySelector(".is-only")?.classList.remove("is-only");
    document.querySelector(`[data-file="${f}"]`).classList.add("is-only");
  }, file);
  const box = await art.boundingBox();
  const width = `${(box.width / 96).toFixed(3)}in`;
  const height = `${(box.height / 96).toFixed(3)}in`;

  const png = resolve(outDir, "png", `${file}.png`);
  if (dpi === 600) await art.screenshot({ path: png, omitBackground: true });
  // A design with its own dpi writes it into the PNG, so a fabric printer prints the metre at a metre
  else {
    let shot = sharp(await art.screenshot({ omitBackground: true }));
    // The shot rounds out to whole CSS pixels: cut it to the design's own, so an 11.34 in bottle wrap is 3402 px (its
    // template's), not 3403
    const scale = dpi / 96;
    const { width: shotW, height: shotH } = await shot.metadata();
    const left = Math.round((box.x - Math.floor(box.x)) * scale);
    const top = Math.round((box.y - Math.floor(box.y)) * scale);
    const exact = { width: Math.min(Math.round(box.width * scale), shotW - left), height: Math.min(Math.round(box.height * scale), shotH - top) };
    if (exact.width !== shotW || exact.height !== shotH) shot = sharp(await shot.extract({ left, top, ...exact }).toBuffer());
    await shot.withMetadata({ density: dpi }).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(png);
  }
  // The page size goes in @page: page.pdf's width and height round further off.
  // pageRanges: a rounding overflow would otherwise add a blank second page.
  const size = await page.addStyleTag({ content: `@page { size: ${width} ${height}; margin: 0; }` });
  await page.pdf({
    path: resolve(outDir, "pdf", `${file}.pdf`),
    preferCSSPageSize: true,
    pageRanges: "1",
    printBackground: true,
    margin: noMargin,
  });
  await size.evaluate((el) => el.remove());
  console.log(`  ✓ ${file} (${width} × ${height})`);
}

// The vector mockups (merch.html's .mockups, hidden on the proof): each [data-mockup] is mockups/<id>.jpg, at 2×
const mockups = (await page.$$eval("[data-mockup]", (els) => els.map((el) => el.dataset.mockup))).filter(
  (id) => !only || id.startsWith(only),
);
if (mockups.length) {
  await mkdir(resolve(outDir, "mockups"), { recursive: true });
  const page = await pageAt(192);
  await page.evaluate(() => (document.documentElement.dataset.mockups = ""));
  for (const id of mockups) {
    const out = resolve(outDir, "mockups", `${id}.jpg`);
    await sharp(await page.locator(`[data-mockup="${id}"]`).screenshot()).jpeg({ quality: 90 }).toFile(out);
    console.log(`  ✓ mockup ${id}`);
  }
}

// A printer's file: every design with the same data-print, one page each, in CMYK, at 600 dpi or its data-print-dpi (an
// A4 sheet at 600 would be some 60 MB). data-trim and data-bleed (in mm) set its boxes.
// data-trim, as the pajamas' data-print is something else: the name of their print.
const printFiles = await page.$$eval(".art[data-print][data-trim]", (els) =>
  els.map((el) => ({
    name: el.dataset.print,
    file: el.dataset.file,
    trim: el.dataset.trim,
    bleed: Number(el.dataset.bleed),
    dpi: Number(el.dataset.printDpi ?? 600),
  })),
);
for (const name of new Set(printFiles.map((p) => p.name))) {
  if (only && !name.startsWith(only)) continue;
  const sides = printFiles.filter((p) => p.name === name);
  const { dpi } = sides[0];
  const page = await pageAt(dpi);
  const shots = [];
  for (const { file } of sides) {
    await page.evaluate((f) => {
      document.documentElement.dataset.only = f;
      document.querySelector(".is-only")?.classList.remove("is-only");
      document.querySelector(`[data-file="${f}"]`).classList.add("is-only");
    }, file);
    const locator = page.locator(`[data-file="${file}"]`);
    // A clip stops at the window, and an A4 sheet is wider than it
    const { width, height } = await locator.boundingBox();
    await page.setViewportSize({ width: Math.max(1056, Math.ceil(width) + 8), height: Math.max(816, Math.ceil(height) + 8) });
    // A locator's screenshot rounds out to whole CSS pixels, which would stretch the art a little over the page: this
    // shoots a little more and cuts it to the art's own pixels.
    const box = await locator.boundingBox();
    const clip = { x: Math.floor(box.x), y: Math.floor(box.y) };
    clip.width = Math.ceil(box.x + box.width) - clip.x;
    clip.height = Math.ceil(box.y + box.height) - clip.y;
    const scale = dpi / 96;
    const art = {
      left: Math.round((box.x - clip.x) * scale),
      top: Math.round((box.y - clip.y) * scale),
      width: Math.round(box.width * scale),
      height: Math.round(box.height * scale),
    };
    shots.push(await sharp(await page.screenshot({ clip })).extract(art).png().toBuffer());
  }
  const path = resolve(outDir, "pdf", `${name}.pdf`);
  const [trimW, trimH] = sides[0].trim.split("x").map(Number);
  await writeCmykPdf(path, shots, { trimW, trimH, bleed: sides[0].bleed, title: name });
  console.log(`  ✓ ${name} (${sides.length} pages, CMYK, ${dpi} dpi)`);
}

await browser.close();
// The sidebar's previews (thumbs.mjs), for whatever PNG just changed
console.log(`  ✓ ${await writeThumbs()} thumbnail(s)`);
console.log(`\nDone. The proof and ${files.length} designs in ${outDir}`);
