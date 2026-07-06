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

// Render the HTML at a manageable px viewport mapped to the 856x2006mm page (1mm = 1px here).
// That gives us 856x2006 px previews — easy to skim, small files.
const VW = 856;
const VH = 2006;

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: VW, height: VH }, deviceScaleFactor: 1 });

for (const banner of banners) {
  const page = await ctx.newPage();
  // Replace the @page CSS with viewport-matched body sizing for screenshot.
  const html = renderBannerHtml(banner).replace(
    "@page { size: 856mm 2006mm; margin: 0; }",
    "@page { size: 856mm 2006mm; margin: 0; } html, body { width: 856mm; height: 2006mm; }",
  );
  await page.setContent(html, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  // Force the body to render at 856x2006 mm but capture at css-pixel size.
  // Use page.emulateMedia('print') so @page rules + print-only styles apply.
  await page.emulateMedia({ media: "print" });

  const outPath = resolve(outDir, `${banner.slug}.preview.png`);
  await page.screenshot({ path: outPath, fullPage: true, omitBackground: false });
  console.log(`  ✓ ${banner.slug}.preview.png`);
  await page.close();
}
await ctx.close();
await browser.close();
console.log(`\nDone. ${banners.length} previews in ${outDir}`);
