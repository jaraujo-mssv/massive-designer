import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const outDir = resolve(repoRoot, "output", "menu");

const menus = [
  { slug: "jaipur-dinner", file: "jaipur-dinner.html" },
];

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 560, height: 794 } });

for (const menu of menus) {
  const page = await ctx.newPage();
  const url = pathToFileURL(resolve(__dirname, menu.file)).href;

  // goto (not setContent) so the logo resolves relatively
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const outPath = resolve(outDir, `${menu.slug}.pdf`);
  await page.pdf({
    path: outPath,
    format: "A5",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  const pages = await page.$$eval(".page", (els) => els.length);
  console.log(`  ✓ ${menu.slug} (${pages} pages) → ${outPath}`);
  await page.close();
}

await ctx.close();
await browser.close();
console.log(`\nDone. ${menus.length} PDFs in ${outDir}`);
