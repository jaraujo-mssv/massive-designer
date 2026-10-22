// Converts an HTML deck into an editable PowerPoint file.
//
// The browser lays the deck out, then every slide is rebuilt from what it drew:
//   - text           → native text boxes, with the browser's line breaks
//   - cards, rules   → native rectangles and lines (fills, borders, dotted
//     icon boxes,      outlines); callouts and tags keep their text inside
//     callouts, tags
//   - icons, logos,  → SVG pictures (PowerPoint can recolour them or
//     diagrams         "Convert to Shape"), with a PNG fallback
//   - photos, mockups→ separate pictures, each one movable and replaceable
//   - the chart      → a native line chart
// Only the slide backdrop (glow and grid) stays a flat background picture.
//
//   node scripts/deck/pptx.mjs <slug…>
//
// Text keeps the fonts the deck uses (Outfit, Inter, Jersey 25…), so they must be
// available where the file is opened. Google Slides has every Google Font.

import { chromium } from "playwright";
import PptxGenJS from "pptxgenjs";
import sharp from "sharp";
import { execFileSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const outDir = resolve(repoRoot, "output", "deck");

const available = readdirSync(__dirname).filter((f) => f.endsWith(".html")).map((f) => f.slice(0, -5));
const asked = process.argv.slice(2);
const unknown = asked.filter((s) => !available.includes(s));
if (!asked.length || unknown.length) {
  if (unknown.length) console.error(`No deck named ${unknown.join(", ")}.`);
  console.error(`Usage: npm run deck:pptx <slug…>\nDecks: ${available.join(", ")}`);
  process.exit(1);
}
// Several decks: one run each, so every deck gets a fresh browser and presentation.
if (asked.length > 1) {
  for (const s of asked) execFileSync(process.execPath, [fileURLToPath(import.meta.url), s], { stdio: "inherit" });
  process.exit(0);
}
const slug = asked[0];
const PX = 96; // CSS px per inch; slides are 1920×1080 px = 20×11.25 in
const W = 1920;
const H = 1080;

await mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(pathToFileURL(resolve(__dirname, `${slug}.html`)).href, { waitUntil: "networkidle" });
await page.evaluate(() => document.fonts.ready);

// Isolation mode: everything invisible except the element being captured.
await page.addStyleTag({
  content: `
    html.iso, html.iso body { background: transparent !important; }
    html.iso * { visibility: hidden !important; }
    html.iso .iso-on, html.iso .iso-on * { visibility: visible !important; }
    html.iso .iso-self { visibility: visible !important; }
    .slide.pptx-solo { margin: 0 !important; }
  `,
});

const count = await page.$$eval(".slide:not([data-hidden])", (els) => els.length);
const slides = [];

for (let index = 0; index < count; index++) {
  // Put this slide alone at the top of the page, so page and slide coordinates agree.
  await page.evaluate((i) => {
    const all = [...document.querySelectorAll(".slide:not([data-hidden])")];
    all.forEach((s, k) => {
      s.style.display = k === i ? "" : "none";
      s.classList.toggle("pptx-solo", k === i);
    });
    window.scrollTo(0, 0);
  }, index);

  const data = await page.evaluate(collect, index);

  // Backdrop: the slide's own background layers with nothing on top.
  const shoot = async (clip, transparent) =>
    (await page.screenshot({ clip, omitBackground: transparent })).toString("base64");
  const full = { x: 0, y: 0, width: W, height: H };

  await page.evaluate(() => {
    document.documentElement.classList.add("iso");
    document.querySelector(".pptx-solo").classList.add("iso-self");
  });
  if (data.photo) {
    // Photo and shade become two pictures over a plain backdrop.
    await page.evaluate((layers) => {
      const s = document.querySelector(".pptx-solo");
      s.dataset.bg = s.style.cssText;
      s.style.backgroundColor = "transparent";
      s.style.backgroundImage = layers.urls.image;
      s.style.backgroundSize = layers.urls.size;
      s.style.backgroundPosition = layers.urls.position;
    }, data.photo);
    data.photo.png = await shoot(full, true);
    await page.evaluate((layers) => {
      const s = document.querySelector(".pptx-solo");
      s.style.backgroundImage = layers.rest.image;
      s.style.backgroundSize = layers.rest.size;
      s.style.backgroundPosition = layers.rest.position;
    }, data.photo);
    data.photo.shade = await shoot(full, true);
    await page.evaluate(() => {
      const s = document.querySelector(".pptx-solo");
      s.style.cssText = s.dataset.bg;
    });
  } else {
    data.backdrop = await shoot(full, false);
  }
  await page.evaluate(() => document.querySelector(".pptx-solo").classList.remove("iso-self"));

  // Pictures, one at a time.
  for (const op of data.ops.filter((o) => o.type === "pic")) {
    await page.evaluate((id) => document.querySelector(`[data-pptx="${id}"]`).classList.add("iso-on"), op.id);
    op.png = await shoot({ x: op.x, y: op.y, width: op.w, height: op.h }, true);
    await page.evaluate((id) => document.querySelector(`[data-pptx="${id}"]`).classList.remove("iso-on"), op.id);
    if (op.src?.endsWith(".svg")) op.svg = await readFile(resolve(__dirname, op.src), "utf8");
  }
  await page.evaluate(() => document.documentElement.classList.remove("iso"));

  slides.push(data);
}
const deckTitle = (await page.title()).replace(/\s+—\s+.*$/, "");
await browser.close();

// ---------- In the page: read one slide into drawing ops, in paint order ----------

function collect(index) {
  const slide = document.querySelector(".pptx-solo");
  const ops = [];
  let picId = 0;

  const cs = (el, pseudo) => getComputedStyle(el, pseudo);
  const rgba = (css) => {
    const m = css.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const [r, g, b, a = 1] = m[1].split(/[ ,/]+/).filter(Boolean).map(Number);
    return { hex: [r, g, b].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("").toUpperCase(), a };
  };
  const opacityOf = (el) => {
    let o = 1;
    for (let e = el; e && e !== slide.parentElement; e = e.parentElement) o *= parseFloat(cs(e).opacity);
    return o;
  };
  // Translucent text is mixed with what's behind it into a solid colour;
  // renderers disagree on how to draw see-through text.
  const flatten = (color, el) => {
    const stack = [];
    for (let e = el; e && e !== slide; e = e.parentElement) stack.unshift(rgba(cs(e).backgroundColor));
    let under = [1, 3, 5].map((i) => parseInt(rgba(cs(slide).backgroundColor).hex.slice(i - 1, i + 1), 16));
    const mix = (c, a) => [1, 3, 5].map((i, k) => parseInt(c.slice(i - 1, i + 1), 16) * a + under[k] * (1 - a));
    for (const bg of stack) if (bg && bg.a > 0) under = mix(bg.hex, bg.a);
    return mix(color.hex, color.a * opacityOf(el)).map((c) => Math.round(c).toString(16).padStart(2, "0")).join("").toUpperCase();
  };
  const rectOf = (el) => {
    const r = el.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  };
  const nameOf = (el, fallback) => {
    const c = [...el.classList].find((k) => !["bad", "good", "on", "off", "shadow", "pptx-solo"].includes(k));
    const n = (c || fallback || el.tagName.toLowerCase()).replace(/^m-/, "");
    return n.charAt(0).toUpperCase() + n.slice(1);
  };
  const isInline = (el) => ["inline", "contents"].includes(cs(el).display) || el.tagName === "BR";
  const directText = (el) =>
    [...el.childNodes].some((n) => n.nodeType === 3 && n.data.trim()) ||
    [...el.children].some((c) => isInline(c) && !c.matches("svg, [data-i], img") && directText(c));

  // Split a multi-layer CSS background into its url() layers and the rest.
  const splitLayers = (s) => {
    const parts = (v) => {
      const out = [];
      let depth = 0, cur = "";
      for (const ch of v) {
        if (ch === "(") depth++;
        if (ch === ")") depth--;
        if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; } else cur += ch;
      }
      out.push(cur.trim());
      return out;
    };
    const img = parts(s.backgroundImage), size = parts(s.backgroundSize), pos = parts(s.backgroundPosition);
    const pick = (keep) => {
      const idx = img.map((v, i) => i).filter((i) => keep(img[i]));
      return {
        image: idx.map((i) => img[i]).join(", "),
        size: idx.map((i) => size[i % size.length]).join(", "),
        position: idx.map((i) => pos[i % pos.length]).join(", "),
      };
    };
    return { urls: pick((v) => v.startsWith("url(")), rest: pick((v) => !v.startsWith("url(")) };
  };

  // ---- Pictures ----
  const isPic = (el) =>
    ["IMG", "CANVAS", "VIDEO"].includes(el.tagName) ||
    el instanceof SVGSVGElement ||
    ([...el.classList].some((c) => c.startsWith("m-")) && !el.matches(".m-chart")) ||
    (cs(el).backgroundImage !== "none" && el !== slide);

  const pic = (el, clip, name) => {
    const id = `${index}-${picId++}`;
    el.dataset.pptx = id;
    let r = clip || rectOf(el);
    // Leave room for drop shadows.
    const shadow = cs(el).boxShadow !== "none";
    if (!clip && shadow) r = { x: r.x - 90, y: r.y - 60, w: r.w + 180, h: r.h + 180 };
    const x = Math.max(0, r.x), y = Math.max(0, r.y);
    const box = { x, y, w: Math.min(1920, r.x + r.w) - x, h: Math.min(1080, r.y + r.h) - y };
    if (box.w < 1 || box.h < 1) return;
    const op = { type: "pic", id, ...box, name: name || nameOf(el), shadow };
    if (el instanceof SVGSVGElement) {
      const clone = el.cloneNode(true);
      clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      clone.setAttribute("width", r.w);
      clone.setAttribute("height", r.h);
      clone.removeAttribute("class");
      clone.removeAttribute("style");
      op.svg = new XMLSerializer().serializeToString(clone).replaceAll("currentColor", cs(el).color);
      op.name = r.w > 200 ? "Diagram" : "Icon";
    } else if (el.tagName === "IMG") {
      op.src = el.getAttribute("src");
      op.name = el.matches(".logo, .foot img") ? "Logo" : "Image";
    }
    ops.push(op);
  };

  // ---- Boxes: fill + borders ----
  const sideSpec = (s, side) => {
    const w = parseFloat(s[`border${side}Width`]);
    const style = s[`border${side}Style`];
    const c = rgba(s[`border${side}Color`]);
    if (!w || style === "none" || style === "hidden" || !c || c.a === 0) return null;
    return { w, style, hex: c.hex, a: c.a };
  };
  const same = (a, b) => a && b && a.w === b.w && a.style === b.style && a.hex === b.hex && a.a === b.a;

  const boxOf = (el) => {
    if (el === slide) return null;
    const s = cs(el);
    const fill = rgba(s.backgroundColor);
    const sides = { Top: sideSpec(s, "Top"), Right: sideSpec(s, "Right"), Bottom: sideSpec(s, "Bottom"), Left: sideSpec(s, "Left") };
    const hasFill = fill && fill.a > 0;
    const anySide = Object.values(sides).some(Boolean);
    if (!hasFill && !anySide) return null;
    const o = opacityOf(el);
    const r = rectOf(el);
    const all = Object.values(sides);
    let outline = null;
    const rules = [];
    if (all.every(Boolean)) {
      // The most common side is the outline; any odd one out is drawn on top.
      outline = all.reduce((best, cand) => (all.filter((x) => same(x, cand)).length > all.filter((x) => same(x, best)).length ? cand : best), all[0]);
      for (const [k, v] of Object.entries(sides)) if (!same(v, outline)) rules.push([k, v]);
    } else {
      for (const [k, v] of Object.entries(sides)) if (v) rules.push([k, v]);
    }
    return {
      ...r,
      fill: hasFill ? { hex: fill.hex, a: fill.a * o } : null,
      outline: outline ? { ...outline, a: outline.a * o } : null,
      radius: parseFloat(s.borderTopLeftRadius) || 0,
      rules: rules.map(([side, v]) => {
        const half = v.w / 2;
        const line =
          side === "Top" ? { x1: r.x, y1: r.y + half, x2: r.x + r.w, y2: r.y + half }
          : side === "Bottom" ? { x1: r.x, y1: r.y + r.h - half, x2: r.x + r.w, y2: r.y + r.h - half }
          : side === "Left" ? { x1: r.x + half, y1: r.y, x2: r.x + half, y2: r.y + r.h }
          : { x1: r.x + r.w - half, y1: r.y, x2: r.x + r.w - half, y2: r.y + r.h };
        return { type: "line", ...line, ...v, a: v.a * o, name: `${nameOf(el)} rule` };
      }),
      name: nameOf(el),
    };
  };

  // ---- Text ----
  const textOf = (el) => {
    const s = cs(el);
    const nodes = [];
    const gather = (node) => {
      for (const c of node.childNodes) {
        if (c.nodeType === 3) nodes.push(c);
        else if (c.nodeType === 1 && isInline(c) && !c.matches("svg, [data-i], img")) gather(c);
      }
    };
    gather(el);

    const lines = [];
    let line = null, lineTop = -Infinity, box = null, first = null;
    const range = document.createRange();
    const append = (ch, style) => {
      const last = line.runs[line.runs.length - 1];
      if (last && Object.keys(style).every((k) => last.style[k] === style[k])) last.text += ch;
      else line.runs.push({ text: ch, style });
    };
    for (const node of nodes) {
      const ps = cs(node.parentElement);
      const style = {
        font: ps.fontFamily.split(",")[0].replace(/["']/g, "").trim(),
        hex: flatten(rgba(ps.color), node.parentElement),
        weight: parseInt(ps.fontWeight, 10),
        size: parseFloat(ps.fontSize),
        spacing: ps.letterSpacing === "normal" ? 0 : parseFloat(ps.letterSpacing),
        italic: ps.fontStyle === "italic",
        underline: ps.textDecorationLine.includes("underline"),
      };
      const tt = ps.textTransform;
      const text = tt === "uppercase" ? node.data.toUpperCase() : tt === "lowercase" ? node.data.toLowerCase() : node.data;
      for (let i = 0; i < node.data.length; i++) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const r = range.getClientRects()[0];
        const ch = text[i];
        const blank = /\s/.test(ch);
        if (!r || r.width === 0) { if (blank && line) line.pending = true; continue; }
        if (!blank && r.top > lineTop + style.size * 0.5) {
          line = { runs: [] };
          lines.push(line);
          lineTop = r.top;
        }
        if (!line) continue;
        if (blank) { line.pending = true; continue; }
        if (line.pending && line.runs.length) append(" ", style);
        line.pending = false;
        append(ch, style);
        first ??= r;
        box = box
          ? { l: Math.min(box.l, r.left), t: Math.min(box.t, r.top), r: Math.max(box.r, r.right), b: Math.max(box.b, r.bottom) }
          : { l: r.left, t: r.top, r: r.right, b: r.bottom };
      }
    }
    if (!box) return null;
    for (const node of nodes) {
      node.parentElement.style.setProperty("color", "transparent", "important");
      node.parentElement.style.setProperty("-webkit-text-fill-color", "transparent", "important");
    }
    const size = parseFloat(s.fontSize);
    const lh = s.lineHeight === "normal" ? size * 1.2 : parseFloat(s.lineHeight);
    const align = s.textAlign === "end" || s.textAlign === "right" ? "right" : s.textAlign === "center" ? "center" : "left";
    return {
      type: "text",
      align,
      lineHeight: lh,
      // Chrome centres glyph boxes in the line box; step back to the line top.
      box: { l: box.l, t: first.top - (lh - first.height) / 2, r: box.r, b: box.b },
      lines: lines.map((l) => l.runs),
      name: nameOf(el, "text"),
    };
  };

  // ---- Chart: rebuild the hand-drawn line chart as data ----
  const chartOf = (el) => {
    const plot = el.querySelector(".plot"), xs = el.querySelector(".x");
    const svg = plot.querySelector("svg");
    const path = [...svg.querySelectorAll("path")].find((p) => p.getAttribute("fill") === "none" && p.getAttribute("stroke")?.startsWith("#"));
    const nums = path.getAttribute("d").match(/-?\d+(\.\d+)?/g).map(Number);
    const ys = [nums[1]];
    for (let i = 2; i + 5 < nums.length; i += 6) ys.push(nums[i + 5]);
    const vb = svg.viewBox.baseVal;
    const labels = [...plot.querySelectorAll(".y span")].map((s) => ({ v: parseFloat(s.textContent), top: parseFloat(s.style.top) / 100 }));
    const hi = labels[0], lo = labels[labels.length - 1];
    const value = (y) => hi.v + ((y - vb.y) / vb.height - hi.top) * ((lo.v - hi.v) / (lo.top - hi.top));
    const a = plot.getBoundingClientRect(), b = xs.getBoundingClientRect();
    const tick = cs(xs);
    return {
      type: "chart",
      x: a.left, y: a.top, w: a.width, h: b.bottom - a.top,
      categories: [...xs.children].map((s) => s.textContent.trim()),
      values: ys.map((y) => Math.round(value(y) * 10000) / 10000),
      min: lo.v, max: hi.v, step: Math.abs(labels[1].v - labels[0].v),
      line: path.getAttribute("stroke").replace("#", "").toUpperCase(),
      tick: rgba(tick.color), tickSize: parseFloat(tick.fontSize),
      grid: rgba(cs(el).borderTopColor),
    };
  };

  // ---- Walk ----
  const visible = (el) => {
    const s = cs(el);
    return el.getClientRects().length && s.visibility !== "hidden" && s.display !== "none" && parseFloat(s.opacity) > 0;
  };

  const visit = (el) => {
    if (!visible(el)) return;
    if (el.matches(".m-chart")) {
      const b = boxOf(el);
      if (b) ops.push(...(b.fill || b.outline ? [{ type: "shape", ...b }] : []), ...b.rules);
      ops.push(chartOf(el));
      for (const c of el.children) if (!c.matches(".plot, .x")) visit(c);
      return;
    }
    if (isPic(el)) return pic(el);

    const b = boxOf(el);
    const hasText = directText(el);
    const blockKids = [...el.children].filter((c) => !isInline(c) || c.matches("svg, img, [data-i]"));

    // A box that only holds a line of text (callouts, tags) stays one shape.
    if (b && hasText && !blockKids.length) {
      const t = textOf(el);
      if (t) { ops.push({ ...t, shape: b }, ...b.rules); return; }
    }
    if (b) ops.push(...(b.fill || b.outline ? [{ type: "shape", ...b }] : []), ...b.rules);

    // Bullets drawn with ::before.
    const before = cs(el, "::before");
    if (before.content !== "none" && before.content !== "normal" && before.position === "absolute") {
      const r = el.getBoundingClientRect();
      pic(el, { x: r.left + parseFloat(before.left), y: r.top + parseFloat(before.top), w: parseFloat(before.width), h: parseFloat(before.height) }, "Bullet");
    }

    if (hasText) {
      const t = textOf(el);
      if (t) ops.push(t);
      for (const c of blockKids) visit(c);
      // Inline icons inside text, e.g. <span class="qi"><i data-i></i></span>
      return;
    }
    for (const c of el.children) visit(c);
  };

  for (const c of slide.children) visit(c);

  const s = cs(slide);
  const layers = splitLayers(s);
  return {
    index,
    section: slide.dataset.sec || "",
    bg: rgba(s.backgroundColor).hex,
    photo: layers.urls.image ? layers : null,
    ops,
  };
}

// ---------- Build the PowerPoint ----------

const inch = (px) => px / PX;
const pt = (px) => Math.round(px * 0.75 * 100) / 100;
const clear = (a) => Math.round((1 - a) * 100);
const dash = (style) => (style === "dotted" ? "sysDot" : style === "dashed" ? "dash" : "solid");

const pres = new PptxGenJS();
pres.defineLayout({ name: "DECK", width: 20, height: 11.25 });
pres.layout = "DECK";
// Every run carries the font the browser used. The theme fonts are the deck's
// most used face (body) and the next one (headings), so new text matches too.
const fontUse = new Map();
for (const s of slides) for (const op of s.ops) if (op.type === "text")
  for (const line of op.lines) for (const run of line) fontUse.set(run.style.font, (fontUse.get(run.style.font) || 0) + run.text.length);
const [bodyFont, headFont = bodyFont] = [...fontUse].sort((a, b) => b[1] - a[1]).map(([f]) => f);
pres.theme = { headFontFace: headFont, bodyFontFace: bodyFont };
pres.title = deckTitle;
pres.author = "Massive";
pres.company = "Massive";

// Keeps the file small: large solid pictures go in as JPEG, anything with
// transparency stays PNG, and a smooth gradient doesn't need retina pixels.
// Pictures without a shadow are flattened onto the slide colour first, which
// only touches their anti-aliased edges.
const compact = async (b64, { smooth = false, flatten = null } = {}) => {
  const input = Buffer.from(b64, "base64");
  let img = sharp(input);
  if (smooth) img = img.resize({ width: W });
  if (flatten) img = img.flatten({ background: `#${flatten}` });
  const opaque = flatten || (await sharp(input).stats()).isOpaque;
  if (opaque && input.length > 100_000) {
    return `image/jpeg;base64,${(await img.jpeg({ quality: 90, mozjpeg: true }).toBuffer()).toString("base64")}`;
  }
  const png = await img.png({ compressionLevel: 9 }).toBuffer();
  return `image/png;base64,${(png.length < input.length ? png : input).toString("base64")}`;
};

for (const s of slides) {
  if (s.photo) {
    s.photo.data = await compact(s.photo.png);
    s.photo.shadeData = await compact(s.photo.shade, { smooth: true });
  } else {
    s.backdrop = await compact(s.backdrop);
  }
  for (const op of s.ops) {
    if (op.type === "pic" && !op.svg) op.data = await compact(op.png, { flatten: op.shadow || op.name === "Bullet" ? null : s.bg });
  }
}

const addPicture = (slide, op) => {
  const opts = { x: inch(op.x), y: inch(op.y), w: inch(op.w), h: inch(op.h), objectName: op.name, altText: op.name };
  if (!op.svg) return slide.addImage({ ...opts, data: op.data });
  // pptxgenjs can't rasterise SVG under Node; hand it our screenshot as the fallback.
  slide.addImage({ ...opts, data: `image/svg+xml;base64,${Buffer.from(op.svg).toString("base64")}` });
  const fallback = slide._relsMedia.findLast((r) => r.isSvgPng);
  fallback.data = `image/png;base64,${op.png}`;
  fallback.isSvgPng = false;
};

const textRuns = (t) =>
  t.lines.flatMap((line, li) =>
    line.map((run, ri) => ({
      text: run.text,
      options: {
        fontFace: run.style.font,
        color: run.style.hex,
        bold: run.style.weight >= 600,
        italic: run.style.italic,
        underline: run.style.underline ? { style: "sng" } : undefined,
        fontSize: pt(run.style.size),
        charSpacing: run.style.spacing ? pt(run.style.spacing) : undefined,
        lineSpacing: pt(t.lineHeight),
        paraSpaceBefore: 0,
        paraSpaceAfter: 0,
        align: t.align,
        breakLine: ri === line.length - 1 && li < t.lines.length - 1,
      },
    })),
  );

const shapeStyle = (b) => ({
  fill: b.fill ? { color: b.fill.hex, transparency: clear(b.fill.a) } : { type: "none" },
  line: b.outline
    ? { color: b.outline.hex, transparency: clear(b.outline.a), width: pt(b.outline.w), dashType: dash(b.outline.style) }
    : { type: "none" },
  ...(b.radius ? { rectRadius: inch(b.radius) } : {}),
});

let section = null;
for (const s of slides) {
  const name = s.section || (s.index === 0 ? "Cover" : "Close");
  if (name !== section) {
    pres.addSection({ title: name });
    section = name;
  }
  const slide = pres.addSlide({ sectionTitle: name });

  if (s.photo) {
    slide.background = { color: s.bg };
    addPicture(slide, { x: 0, y: 0, w: W, h: H, data: s.photo.data, name: "Photo" });
    addPicture(slide, { x: 0, y: 0, w: W, h: H, data: s.photo.shadeData, name: "Shade" });
  } else {
    slide.background = { data: s.backdrop };
  }

  for (const op of s.ops) {
    if (op.type === "pic") addPicture(slide, op);

    if (op.type === "shape") {
      const type = op.radius ? pres.ShapeType.roundRect : pres.ShapeType.rect;
      slide.addShape(type, { x: inch(op.x), y: inch(op.y), w: inch(op.w), h: inch(op.h), objectName: op.name, ...shapeStyle(op) });
    }

    if (op.type === "line") {
      slide.addShape(pres.ShapeType.line, {
        x: inch(op.x1), y: inch(op.y1), w: inch(op.x2 - op.x1), h: inch(op.y2 - op.y1),
        line: { color: op.hex, transparency: clear(op.a), width: pt(op.w), dashType: dash(op.style) },
        objectName: op.name,
      });
    }

    if (op.type === "text") {
      const runs = textRuns(op);
      if (op.shape) {
        // Text inside its own box: inset to where the browser put it.
        const b = op.shape;
        slide.addText(runs, {
          shape: op.shape.radius ? pres.ShapeType.roundRect : pres.ShapeType.rect,
          x: inch(b.x), y: inch(b.y), w: inch(b.w), h: inch(b.h),
          margin: [pt(op.box.l - b.x), 0, 0, pt(op.box.t - b.y)],
          valign: "top",
          wrap: op.lines.length > 1,
          fontFace: op.lines[0][0].style.font,
          objectName: b.name,
          ...shapeStyle(b),
        });
        continue;
      }
      // Leave room for small metric differences between renderers, growing
      // away from the aligned edge.
      const w = op.box.r - op.box.l;
      const slack = Math.max(24, w * 0.08);
      const x = op.align === "center" ? op.box.l - slack / 2 : op.align === "right" ? op.box.l - slack : op.box.l;
      slide.addText(runs, {
        x: inch(x), y: inch(op.box.t), w: inch(w + slack), h: inch(op.lines.length * op.lineHeight + 4),
        margin: 0, valign: "top", fontFace: op.lines[0][0].style.font, fit: "none", isTextBox: true, objectName: op.name,
      });
    }

    if (op.type === "chart") {
      const tick = op.tick.hex;
      slide.addChart(pres.ChartType.line, [{ name: "Blocked", labels: op.categories, values: op.values }], {
        x: inch(op.x), y: inch(op.y), w: inch(op.w), h: inch(op.h),
        objectName: "Chart",
        lineSmooth: true,
        lineSize: 2.25,
        lineDataSymbol: "none",
        chartColors: [op.line],
        showLegend: false,
        valAxisMinVal: op.min,
        valAxisMaxVal: op.max,
        valAxisMajorUnit: op.step,
        valAxisLabelFormatCode: '0.00"%"',
        valAxisLabelColor: tick,
        catAxisLabelColor: tick,
        valAxisLabelFontSize: pt(op.tickSize),
        catAxisLabelFontSize: pt(op.tickSize),
        valAxisLabelFontFace: bodyFont,
        catAxisLabelFontFace: bodyFont,
        valAxisLineShow: false,
        catAxisLineShow: false,
        valGridLine: { color: "2A292F", size: 0.75 },
        catGridLine: { style: "none" },
      });
    }
  }
}

const outPath = resolve(outDir, `${slug}.pptx`);
await pres.writeFile({ fileName: outPath });
const tally = slides.flatMap((s) => s.ops).reduce((t, o) => ({ ...t, [o.type]: (t[o.type] || 0) + 1 }), {});
console.log(`  ✓ ${slug} (${slides.length} slides; ${Object.entries(tally).map(([k, v]) => `${v} ${k}`).join(", ")}) → ${outPath}`);
