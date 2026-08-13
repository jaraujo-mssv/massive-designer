import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const outDir = resolve(repoRoot, "output", "docs");

const docs = [
  { slug: "blocked-destinations", file: "blocked-destinations.html" },
  { slug: "best-practices", file: "best-practices.html" },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1240, height: 1754 } });

for (const doc of docs) {
  const page = await ctx.newPage();
  const url = pathToFileURL(resolve(__dirname, doc.file)).href;

  // goto (not setContent) so the shared stylesheet and logo resolve relatively
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const outPath = resolve(outDir, `${doc.slug}.pdf`);
  await page.pdf({
    path: outPath,
    format: "A4",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  const pages = await page.$$eval(".page", (els) => els.length);
  console.log(`  ✓ ${doc.slug} (${pages} pages) → ${outPath}`);
  await page.close();
}

await ctx.close();
await browser.close();
console.log(`\nDone. ${docs.length} PDFs in ${outDir}`);
