// The Team Photo tab's themed backgrounds: one 1080 px square SVG each, in public/team-photo/themes/.
// The tab shows them behind the cut-outs and draws the same file into a downloaded JPG, so each SVG is
// self-contained (no fonts, no links: an SVG drawn as an image can't load anything).
//
//   node scripts/team-photo/themes.mjs
//
// The face covers the middle of the square and the T-shirt its bottom, so each theme puts its detail
// round the edges and in the top corners. Colours are the tab's warm pastels and Massive's reds; the
// world map is the merch one (scripts/merch/world/world-outline.svg). Scattered shapes come from a
// seeded random, so a rerun gives the same files. Add a theme here and in src/tools/team-photo/app/themes.ts.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const OUT = path.join(ROOT, 'public/team-photo/themes');
const S = 1080;

const INK = '#171615';
const GROUND = '#fff7f2';
const RED = '#d74939';
const RED_LIGHT = '#ff8163';
const ORANGE = '#F69666';
const MERCH_ORANGE = '#F38165';
const YELLOW = '#FFC857';
const PEACH = '#FFC6A5';

/** mulberry32: a small seeded random, so the scattered themes don't change from run to run. */
function random(seed) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const n = (v) => Math.round(v * 10) / 10;
const svg = (title, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">\n<title>${title}</title>\n${body}\n</svg>\n`;

/** The world's countries in orange outline on the soft orange ground, large enough to run off both sides. */
function worldMap() {
  const src = readFileSync(path.join(ROOT, 'scripts/merch/world/world-outline.svg'), 'utf8');
  const [, w, h] = src.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/).map(Number);
  const paths = [...src.matchAll(/<path d="([^"]+)"\/>/g)].map((m) => m[1]);
  const scale = 1.32;
  const tx = (S - w * scale) / 2;
  const ty = (S - h * scale) / 2 - 40;
  return svg(
    'World map',
    `<rect width="${S}" height="${S}" fill="${GROUND}"/>\n` +
      `<g transform="translate(${n(tx)} ${n(ty)}) scale(${scale})" fill="${MERCH_ORANGE}" fill-opacity="0.07" stroke="${MERCH_ORANGE}" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">\n` +
      paths.map((d) => `<path d="${d}"/>`).join('\n') +
      '\n</g>',
  );
}

/**
 * Massive's light register: the line grid on the soft orange, and the red corner brackets (BRAND.md), drawn
 * stronger than a post's so they still read on a small tile.
 */
function grid() {
  const lines = [];
  for (let v = 60; v < S; v += 60) lines.push(`M${v} 0V${S}`, `M0 ${v}H${S}`);
  const arm = 72;
  const inset = 56;
  const corner = (x, y, dx, dy) => `M${x + dx * arm} ${y}H${x}V${y + dy * arm}`;
  const brackets = [
    corner(inset, inset, 1, 1),
    corner(S - inset, inset, -1, 1),
    corner(inset, S - inset, 1, -1),
    corner(S - inset, S - inset, -1, -1),
  ];
  return svg(
    'Massive grid',
    `<rect width="${S}" height="${S}" fill="${GROUND}"/>\n` +
      `<path d="${lines.join('')}" stroke="${INK}" stroke-opacity="0.1" stroke-width="2"/>\n` +
      `<path d="${brackets.join('')}" fill="none" stroke="${RED}" stroke-width="7" stroke-linecap="square"/>`,
  );
}

/** A six-armed snowflake: three crossing strokes, each with a pair of short branches near its ends. */
function snowflake(x, y, r, rotate) {
  const arms = [];
  for (let k = 0; k < 6; k++) {
    const a = (Math.PI / 3) * k;
    const ex = Math.cos(a) * r;
    const ey = Math.sin(a) * r;
    arms.push(`M0 0L${n(ex)} ${n(ey)}`);
    const bx = Math.cos(a) * r * 0.6;
    const by = Math.sin(a) * r * 0.6;
    for (const side of [-1, 1]) {
      const b = a + side * 0.7;
      arms.push(`M${n(bx)} ${n(by)}l${n(Math.cos(b) * r * 0.32)} ${n(Math.sin(b) * r * 0.32)}`);
    }
  }
  return `<path transform="translate(${n(x)} ${n(y)}) rotate(${n(rotate)})" d="${arms.join('')}"/>`;
}

/** String lights along the top, bulbs in the reds and a yellow, and snowflakes round the edges. */
function holidays() {
  const rand = random(12);
  const flakes = [];
  // One flake per cell of a grid under the lights, placed at random inside it, so both sides get their
  // share (a plain random scatter left the right side almost bare); a few cells stay empty.
  const cols = 6;
  const rows = 6;
  const top = 210;
  const cw = S / cols;
  const ch = (S - top) / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rand() < 0.12) continue;
      const x = (c + 0.15 + rand() * 0.7) * cw;
      const y = top + (r + 0.15 + rand() * 0.7) * ch;
      flakes.push(snowflake(x, y, 14 + rand() * 22, rand() * 60));
    }
  }
  // The wire: a sag across the top, from just off the left edge to just off the right.
  const p0 = [-40, 60];
  const p1 = [S / 2, 240];
  const p2 = [S + 40, 60];
  const at = (t) => [
    (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0],
    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1],
  ];
  const colours = [RED, YELLOW, ORANGE, RED_LIGHT];
  const bulbs = [];
  const count = 15;
  for (let i = 0; i < count; i++) {
    const t = (i + 0.5) / count;
    const [x, y] = at(t);
    const [x2, y2] = at(Math.min(1, t + 0.01));
    // Hang straight down from the wire, tipped a little either way.
    const tilt = (Math.atan2(y2 - y, x2 - x) * 180) / Math.PI * 0.35 + (i % 2 ? 8 : -8);
    const c = colours[i % colours.length];
    bulbs.push(
      `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(tilt)})">` +
        `<circle cy="34" r="34" fill="${c}" fill-opacity="0.16"/>` +
        `<rect x="-7" y="0" width="14" height="13" rx="3" fill="${INK}" fill-opacity="0.75"/>` +
        `<ellipse cy="32" rx="12" ry="20" fill="${c}"/>` +
        `<ellipse cx="-4" cy="26" rx="3.5" ry="7" fill="#fff" fill-opacity="0.45"/>` +
        `</g>`,
    );
  }
  return svg(
    'Holidays',
    `<rect width="${S}" height="${S}" fill="${GROUND}"/>\n` +
      `<g fill="none" stroke="${PEACH}" stroke-width="4" stroke-linecap="round">\n${flakes.join('\n')}\n</g>\n` +
      `<path d="M${p0.join(' ')}Q${p1.join(' ')} ${p2.join(' ')}" fill="none" stroke="${INK}" stroke-opacity="0.7" stroke-width="4"/>\n` +
      bulbs.join('\n'),
  );
}

/** A sun behind the head with a sunburst round it, a warm sea at the bottom, and a few gulls. */
function summer() {
  const cx = S / 2;
  const cy = 470;
  const rays = [];
  const count = 24;
  for (let i = 0; i < count; i += 2) {
    const a0 = (2 * Math.PI * i) / count;
    const a1 = (2 * Math.PI * (i + 1)) / count;
    const r = 1100;
    rays.push(`M${cx} ${cy}L${n(cx + Math.cos(a0) * r)} ${n(cy + Math.sin(a0) * r)}L${n(cx + Math.cos(a1) * r)} ${n(cy + Math.sin(a1) * r)}Z`);
  }
  const wave = (y, amp, len, colour) => {
    let d = `M0 ${y}`;
    for (let x = 0; x < S; x += len) d += `q${len / 4} ${-amp} ${len / 2} 0t${len / 2} 0`;
    return `<path d="${d}V${S}H0Z" fill="${colour}"/>`;
  };
  const gull = (x, y, w) =>
    `<path d="M${x - w} ${y}q${w / 2} ${-w * 0.6} ${w} 0q${w / 2} ${-w * 0.6} ${w} 0"/>`;
  return svg(
    'Summer',
    `<rect width="${S}" height="${S}" fill="#FFF2C4"/>\n` +
      `<path d="${rays.join('')}" fill="#FFE59A" fill-opacity="0.75"/>\n` +
      `<circle cx="${cx}" cy="${cy}" r="300" fill="#FFCF70"/>\n` +
      `<circle cx="${cx}" cy="${cy}" r="300" fill="none" stroke="#FFB44D" stroke-opacity="0.35" stroke-width="18"/>\n` +
      wave(820, 22, 160, PEACH) +
      '\n' +
      wave(880, 20, 140, '#FFB4A0') +
      '\n' +
      wave(950, 18, 120, '#FFA48E') +
      '\n' +
      `<g fill="none" stroke="${INK}" stroke-opacity="0.5" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">${gull(860, 150, 26)}${gull(930, 205, 18)}${gull(160, 230, 20)}</g>`,
  );
}

/** Confetti in the reds, the orange, a yellow and a little ink, everywhere the face isn't. */
function confetti() {
  const rand = random(7);
  const colours = [RED, RED_LIGHT, ORANGE, YELLOW, PEACH, RED, ORANGE, INK];
  const pieces = [];
  for (let i = 0; i < 110; i++) {
    const x = rand() * S;
    const y = rand() * S;
    const c = colours[Math.floor(rand() * colours.length)];
    const rot = n(rand() * 180);
    const kind = rand();
    if (kind < 0.5) {
      const w = 24 + rand() * 24;
      const h = 10 + rand() * 7;
      pieces.push(`<rect x="${n(-w / 2)}" y="${n(-h / 2)}" width="${n(w)}" height="${n(h)}" rx="1.5" fill="${c}" transform="translate(${n(x)} ${n(y)}) rotate(${rot})"/>`);
    } else if (kind < 0.75) {
      pieces.push(`<circle cx="${n(x)}" cy="${n(y)}" r="${n(7 + rand() * 7)}" fill="${c}"/>`);
    } else {
      const step = 15 + rand() * 6;
      pieces.push(
        `<path d="M${n(-step * 1.5)} 0l${n(step / 2)} -11l${n(step / 2)} 11l${n(step / 2)} -11l${n(step / 2)} 11l${n(step / 2)} -11l${n(step / 2)} 11" fill="none" stroke="${c}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" transform="translate(${n(x)} ${n(y)}) rotate(${rot})"/>`,
      );
    }
  }
  return svg('Confetti', `<rect width="${S}" height="${S}" fill="${GROUND}"/>\n${pieces.join('\n')}`);
}

mkdirSync(OUT, { recursive: true });
const themes = { 'world-map': worldMap, grid, holidays, summer, confetti };
for (const [id, make] of Object.entries(themes)) {
  const file = path.join(OUT, `${id}.svg`);
  writeFileSync(file, make());
  console.log(`[team-photo] ✓ themes/${id}.svg (${Math.round(readFileSync(file).length / 1024)} KB)`);
}
