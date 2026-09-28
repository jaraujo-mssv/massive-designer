import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const outDir = resolve(repoRoot, "output", "deck");

const decks = [
  { slug: "consent-sourcing", file: "consent-sourcing.html" },
  { slug: "consent-sourcing-v2", file: "consent-sourcing-v2.html" },
];

// `--png` also writes one screenshot per slide, for reviewing the draft.
const withPng = process.argv.includes("--png");

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1920, height: 1080 } });

for (const deck of decks) {
  const page = await ctx.newPage();
  const url = pathToFileURL(resolve(__dirname, deck.file)).href;

  // goto (not setContent) so the stylesheets and _assets resolve relatively
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  if (withPng) {
    const pngDir = resolve(outDir, deck.slug);
    await mkdir(pngDir, { recursive: true });
    const slides = await page.$$(".slide:not([data-hidden])");
    for (const [i, slide] of slides.entries()) {
      await slide.screenshot({ path: resolve(pngDir, `${String(i + 1).padStart(2, "0")}.png`) });
    }
  }

  const outPath = resolve(outDir, `${deck.slug}.pdf`);
  await page.pdf({
    path: outPath,
    printBackground: true,
    preferCSSPageSize: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
  });

  const count = await page.$$eval(".slide:not([data-hidden])", (els) => els.length);
  console.log(`  ✓ ${deck.slug} (${count} slides) → ${outPath}`);
  await page.close();
}

await ctx.close();
await browser.close();
console.log(`\nDone. ${decks.length} deck(s) in ${outDir}`);
