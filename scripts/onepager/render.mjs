import { chromium } from "playwright";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const htmlPath = resolve(__dirname, "compliance-onepager.html");
const outDir = resolve(repoRoot, "output", "onepager");
const outPath = resolve(outDir, "compliance-onepager.pdf");

await mkdir(outDir, { recursive: true });

const html = await readFile(htmlPath, "utf8");

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1240, height: 1754 } });
const page = await ctx.newPage();

await page.setContent(html, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

await page.pdf({
  path: outPath,
  format: "A4",
  printBackground: true,
  preferCSSPageSize: true,
  margin: { top: 0, right: 0, bottom: 0, left: 0 },
});

console.log(`  ✓ compliance one-pager → ${outPath}`);

await ctx.close();
await browser.close();
