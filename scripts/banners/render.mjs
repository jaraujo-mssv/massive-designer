import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { banners } from "./banners.config.mjs";
import { renderBannerHtml } from "./template.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const outDir = resolve(repoRoot, "output", "banners");

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1200, height: 800 } });

for (const banner of banners) {
  const page = await ctx.newPage();
  const html = renderBannerHtml(banner);
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const outPath = resolve(outDir, `${banner.slug}.pdf`);
  await page.pdf({
    path: outPath,
    width: "856mm",
    height: "2006mm",
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });
  console.log(`  ✓ ${banner.slug} → ${outPath}`);
  await page.close();
}

await ctx.close();
await browser.close();
console.log(`\nDone. ${banners.length} PDFs in ${outDir}`);
