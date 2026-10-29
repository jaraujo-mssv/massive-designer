import { chromium } from "playwright";
import { copyFile, mkdir, readdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
// public/, not output/: the Merch tab serves these on the live site.
const outDir = resolve(repoRoot, "public", "merch-files");

//   node scripts/merch/render.mjs
// merch.html is the proof sheet. Each [data-file] in it is one design, also printed on its own at its own size.
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

const files = await page.$$eval(".art[data-file]", (els) => els.map((el) => [el.dataset.file, Number(el.dataset.dpi ?? 600)]));
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
    const shot = await art.screenshot({ omitBackground: true });
    await sharp(shot).withMetadata({ density: dpi }).png({ compressionLevel: 9, adaptiveFiltering: true }).toFile(png);
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

await browser.close();
console.log(`\nDone. The proof and ${files.length} designs in ${outDir}`);
