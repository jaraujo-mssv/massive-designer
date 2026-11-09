// Outlines the 404 back's letters and cuts the gap round them out of its mountain, as plain paths, so the PDF that
// Chromium writes is vector and every viewer draws it the same (an SVG mask comes out as a raster soft mask that some
// viewers misplace or drop). Writes two paths into merch.html: #tee-back-404-letters, the letters, and
// #tee-back-404-mountain-shape, the logo's mountain less the letters grown by GAP, in the icon's own units so it keeps
// the logo gradient. The halftone isn't cut here: merch.html clips it with real circles.
//
//   npm i --no-save clipper-lib && node scripts/merch/tees/outline-404.mjs
//
// Run it after changing LINES, GAP or the placement below, which must match #tee-back-404 in merch.html. fontkit comes
// with hyperframes; the font is Outfit Black, the static file Google Fonts serves.
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const fontkit = require("fontkit");
const ClipperLib = require("clipper-lib");

const __dirname = dirname(fileURLToPath(import.meta.url));
const html = resolve(__dirname, "..", "merch.html");

// In the 404 back's own units (hundredths of an inch before its scale), as the old <text> set them: centred on x,
// the baseline at y, slanted with skewX(SKEW) from the baseline.
const LINES = [
  { text: "404", size: 300, x: -22, y: 300 },
  { text: "EXCUSE NOT FOUND", size: 96, x: -7, y: 450 },
];
const SKEW = -12;
const GAP = 12;
// The mountain: #icon (viewBox 0 11.12 283.38 112.47) drawn at x -450, y 0, 900 wide
const ICON = { x: -450, y: 0, width: 900, viewBox: [0, 11.12, 283.38, 112.47] };
const ICON_SCALE = ICON.width / ICON.viewBox[2];

const SCALE = 1000; // Clipper works in integers
const FLATNESS = 0.05; // the most a flattened curve strays, in the 404 back's units

const css = await (await fetch("https://fonts.googleapis.com/css2?family=Outfit:wght@900")).text();
const fontUrl = /url\((https:[^)]+\.ttf)\)/.exec(css)?.[1];
if (!fontUrl) throw new Error("no TTF in Google Fonts' CSS for Outfit 900");
const font = fontkit.create(Buffer.from(await (await fetch(fontUrl)).arrayBuffer()));

const fmt = (n) => (Math.round(n * 100) / 100).toString();

/** A cubic's points, flat to FLATNESS (each segment checked by its control points' distance from the chord). */
function flattenCubic(out, p0, p1, p2, p3, depth = 0) {
  const d = (p) => {
    const [dx, dy] = [p3[0] - p0[0], p3[1] - p0[1]];
    const len = Math.hypot(dx, dy) || 1;
    return Math.abs((p[0] - p0[0]) * dy - (p[1] - p0[1]) * dx) / len;
  };
  if (depth > 12 || Math.max(d(p1), d(p2)) <= FLATNESS) return out.push(p3);
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const [a, b, c] = [mid(p0, p1), mid(p1, p2), mid(p2, p3)];
  const [e, f] = [mid(a, b), mid(b, c)];
  const g = mid(e, f);
  flattenCubic(out, p0, a, e, g, depth + 1);
  flattenCubic(out, g, f, c, p3, depth + 1);
}

/** Path commands ({ op, pts }) → the SVG d, and → closed polygons in Clipper's integer units. */
function toD(commands) {
  return commands
    .map(({ op, pts }) => op + pts.map(([x, y]) => `${fmt(x)} ${fmt(y)}`).join(" "))
    .join("");
}
function toPolygons(commands) {
  const polys = [];
  let poly = null;
  let at = [0, 0];
  for (const { op, pts } of commands) {
    if (op === "M") {
      poly = [pts[0]];
      polys.push(poly);
      at = pts[0];
    } else if (op === "L") {
      poly.push(pts[0]);
      at = pts[0];
    } else if (op === "Q") {
      const [c, end] = pts;
      const c1 = [at[0] + (2 / 3) * (c[0] - at[0]), at[1] + (2 / 3) * (c[1] - at[1])];
      const c2 = [end[0] + (2 / 3) * (c[0] - end[0]), end[1] + (2 / 3) * (c[1] - end[1])];
      flattenCubic(poly, at, c1, c2, end);
      at = end;
    } else if (op === "C") {
      flattenCubic(poly, at, pts[0], pts[1], pts[2]);
      at = pts[2];
    }
  }
  return polys.map((p) => p.map(([x, y]) => ({ X: Math.round(x * SCALE), Y: Math.round(y * SCALE) })));
}
const polygonsToD = (polys) =>
  polys.map((p) => "M" + p.map(({ X, Y }) => `${fmt(X / SCALE)} ${fmt(Y / SCALE)}`).join("L") + "Z").join("");

// The letters, laid out as Chromium sets a centred SVG <text> (kerned, the anchor half the advance)
const skew = Math.tan((SKEW * Math.PI) / 180);
const letters = [];
for (const line of LINES) {
  const run = font.layout(line.text);
  const k = line.size / font.unitsPerEm;
  const advance = run.positions.reduce((sum, p) => sum + p.xAdvance, 0);
  let pen = -advance / 2;
  run.glyphs.forEach((glyph, i) => {
    const pos = run.positions[i];
    // Font units are y-up from the baseline; skewX slants x by y (SVG's y, down)
    const place = ([fx, fy]) => {
      const x = (pen + pos.xOffset + fx) * k;
      const y = -(pos.yOffset + fy) * k;
      return [line.x + x + skew * y, line.y + y];
    };
    for (const c of glyph.path.commands) {
      const map = { moveTo: "M", lineTo: "L", quadraticCurveTo: "Q", bezierCurveTo: "C", closePath: "Z" };
      const pts = [];
      for (let j = 0; j < c.args.length; j += 2) pts.push(place([c.args[j], c.args[j + 1]]));
      letters.push({ op: map[c.command], pts });
    }
    pen += pos.xAdvance;
  });
}

// The mountain, from #icon's path (absolute M L H V C Z), in the icon's units
const source = readFileSync(html, "utf8");
const iconD = /<symbol id="icon"[^>]*>\s*<path[^>]*\sd="([^"]+)"/.exec(source)?.[1];
if (!iconD) throw new Error("no #icon path in merch.html");
const mountain = [];
{
  const tokens = iconD.match(/[MLHVCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi);
  let i = 0;
  let at = [0, 0];
  let start = [0, 0];
  let op = null;
  const num = () => Number(tokens[i++]);
  while (i < tokens.length) {
    if (/[A-Z]/i.test(tokens[i])) op = tokens[i++];
    if (op === "M") (at = start = [num(), num()]), mountain.push({ op: "M", pts: [at] }), (op = "L");
    else if (op === "L") (at = [num(), num()]), mountain.push({ op: "L", pts: [at] });
    else if (op === "H") (at = [num(), at[1]]), mountain.push({ op: "L", pts: [at] });
    else if (op === "V") (at = [at[0], num()]), mountain.push({ op: "L", pts: [at] });
    else if (op === "C") {
      const pts = [[num(), num()], [num(), num()], [num(), num()]];
      mountain.push({ op: "C", pts });
      at = pts[2];
    } else if (op === "Z") (mountain.push({ op: "Z", pts: [] }), (at = start), (op = null));
    else throw new Error(`#icon: unexpected ${op ?? tokens[i]} (absolute M L H V C Z only)`);
  }
}

// The letters into the icon's units, grown by GAP (round), and cut out of the mountain
const toIcon = ({ X, Y }) => ({
  X: Math.round(((X / SCALE - ICON.x) / ICON_SCALE + ICON.viewBox[0]) * SCALE),
  Y: Math.round(((Y / SCALE - ICON.y) / ICON_SCALE + ICON.viewBox[1]) * SCALE),
});
const letterPolys = toPolygons(letters).map((p) => p.map(toIcon));
const union = new ClipperLib.Paths();
{
  const c = new ClipperLib.Clipper();
  c.AddPaths(letterPolys, ClipperLib.PolyType.ptSubject, true);
  c.Execute(ClipperLib.ClipType.ctUnion, union, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
}
const grown = new ClipperLib.Paths();
{
  const o = new ClipperLib.ClipperOffset(2, (FLATNESS / ICON_SCALE) * SCALE);
  o.AddPaths(union, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
  o.Execute(grown, (GAP / ICON_SCALE) * SCALE);
}
const cut = new ClipperLib.Paths();
{
  const c = new ClipperLib.Clipper();
  c.AddPaths(toPolygons(mountain), ClipperLib.PolyType.ptSubject, true);
  c.AddPaths(grown, ClipperLib.PolyType.ptClip, true);
  c.Execute(ClipperLib.ClipType.ctDifference, cut, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
}

const write = (id, d) => {
  const re = new RegExp(`(<path id="${id}"[^>]*\\sd=")[^"]*(")`);
  if (!re.test(updated)) throw new Error(`no <path id="${id}" d="…"> in merch.html`);
  updated = updated.replace(re, `$1${d}$2`);
};
let updated = source;
write("tee-back-404-letters", toD(letters));
write("tee-back-404-mountain-shape", polygonsToD(cut));
writeFileSync(html, updated);
console.log(`✓ merch.html: the 404 back's letters (${letters.length} commands) and mountain (${cut.length} outlines)`);
