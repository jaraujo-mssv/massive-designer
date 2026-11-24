#!/usr/bin/env node
/*
 * One source of timing for onelaunch-file-scanning-3d.
 *
 *   node timing.build.mjs
 *
 * Reads SCRIPT.md (one "## Line N — label (Frame F)" per subtitle page). If voice.json exists (npm run video:voice),
 * its line cues and word timings are used as they are; otherwise every line is estimated with sparktray-campaign's
 * captionWords weighting (brand/ui/caption-timing.ts: word overhead + syllables + punctuation pauses).
 *
 * Writes js/captions-data.js (window.OL_CAPTIONS: lines, words, frames, total) and moves every clip to match:
 * the scene hosts and the full-length clips in index.html, each composition's data-duration, the voice clip, the
 * music fades, and the per-frame durations in STORYBOARD.md. Scenes read their click marks from OL_CAPTIONS, so
 * after a new take nothing else needs editing.
 */
import { existsSync, readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = dirname(fileURLToPath(import.meta.url));
const FPS = 30;
const HOLD = 2.5; // the end card holds still after the last word (it becomes the poster)
const MUSIC = 0.07; // calm-lo-fi bed level, as in what-does-consent-look-like
const f = (s) => Math.round(s * FPS); // seconds → frames
const sec = (fr) => +(fr / FPS).toFixed(6);

// ── SCRIPT.md ─────────────────────────────────────────────────────────
const script = readFileSync(join(DIR, 'SCRIPT.md'), 'utf8');
const lines = [];
for (const block of script.split(/^## /m).slice(1)) {
  const head = block.split('\n')[0];
  const m = head.match(/^Line (\d+)\b.*\(Frame (\d+)\)/);
  if (!m) continue;
  const spoken = block.split('\n').filter((l) => /^( {4}|\t)/.test(l)).map((l) => l.trim()).join(' ').replace(/\s+/g, ' ').trim();
  const text = spoken.replace(/\[[^\]]+\]\s*/g, '').trim(); // ElevenLabs tags are directions, never subtitles
  lines.push({ n: +m[1], frame: +m[2], label: head.split('—')[1]?.replace(/\(Frame.*$/, '').trim(), text });
}
if (!lines.length) throw new Error('No "## Line N — … (Frame F)" blocks in SCRIPT.md');

// ── Timings: the real take, or the campaign's estimate ────────────────
const WORD_OVERHEAD = 0.55;
const PAUSE = { ',': 0.9, ';': 1.1, ':': 1.1, '.': 1.6, '!': 1.6, '?': 1.6, '…': 1.8 };
const syllables = (word) => {
  const w = word.toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return 1;
  let n = (w.match(/[aeiouy]+/g) || []).length || 1;
  if (w.length > 2 && w.endsWith('e') && !w.endsWith('le')) n -= 1;
  return Math.max(1, n);
};
const weight = (t) => WORD_OVERHEAD + syllables(t) + [...t.slice(-3)].reduce((s, ch) => s + (PAUSE[ch] ?? 0), 0);
function captionWords(text, seconds, leadIn, tailOut) {
  const tokens = text.split(/\s+/).filter(Boolean);
  const speech = Math.max(0.1, seconds - leadIn - tailOut);
  const ws = tokens.map(weight);
  const total = ws.reduce((a, b) => a + b, 0);
  let cur = leadIn;
  return tokens.map((t, i) => { const start = cur; cur += (ws[i] / total) * speech; return { text: t, start: +start.toFixed(3), end: +cur.toFixed(3) }; });
}

let source = 'estimate';
const voicePath = join(DIR, 'voice.json');
let voice = null;
if (existsSync(voicePath)) {
  voice = JSON.parse(readFileSync(voicePath, 'utf8'));
  source = `voice ${voice.file}`;
  for (const l of lines) {
    const v = voice.lines.find((x) => x.n === l.n);
    if (!v) throw new Error(`voice.json has no line ${l.n}: record again (npm run video:voice onelaunch-file-scanning-3d)`);
    Object.assign(l, { from: v.from, to: v.to, words: v.words.filter((w) => !/^\[.*\]$/.test(w.text)) });
  }
} else {
  // Estimate: 0.165 s per weight unit (≈2.7 words a second, Mark's pace), 0.6 s between lines on one screen,
  // 0.85 s where the scene changes, 0.5 s of silence before the first word.
  const UNIT = 0.165, GAP = 0.6, SCENE_GAP = 0.85, LEAD = 0.5;
  let t = LEAD;
  const spans = lines.map((l, i) => {
    if (i) t += lines[i - 1].frame === l.frame ? GAP : SCENE_GAP;
    const start = t;
    t += l.text.split(/\s+/).reduce((s, w) => s + weight(w), 0) * UNIT;
    return { start, end: t };
  });
  lines.forEach((l, i) => {
    l.from = i ? (spans[i - 1].end + spans[i].start) / 2 : 0;
    l.to = i < lines.length - 1 ? (spans[i].end + spans[i + 1].start) / 2 : spans[i].end + 0.2;
    l.words = captionWords(l.text, l.to - l.from, spans[i].start - l.from, l.to - spans[i].end);
    l.from = +l.from.toFixed(3); l.to = +l.to.toFixed(3);
  });
}

// Cues on the frame grid: a subtitle page changes on the same frame as its scene cut (no one-frame leftovers).
for (const l of lines) {
  const snapped = sec(f(l.from));
  const shift = +(l.from - snapped).toFixed(6);
  l.words = l.words.map((w) => ({ ...w, start: +(w.start + shift).toFixed(3), end: +(w.end + shift).toFixed(3) }));
  l.from = snapped;
  l.to = sec(f(l.to));
}

const lastWord = lines.at(-1).from + lines.at(-1).words.at(-1).end;
const totalF = f(lastWord + HOLD);
const frameNos = [...new Set(lines.map((l) => l.frame))];
const frames = frameNos.map((n, i) => {
  const startF = i ? f(lines.find((l) => l.frame === n).from) : 0;
  return { n, startF };
});
frames.forEach((fr, i) => { fr.durF = (i < frames.length - 1 ? frames[i + 1].startF : totalF) - fr.startF; });

// ── index.html and compositions ───────────────────────────────────────
const setAttr = (html, id, attr, value) => {
  const re = new RegExp(`(<[^>]*\\bid="${id}"[^>]*?\\b${attr}=")[^"]*(")`, 's');
  if (!re.test(html)) throw new Error(`index.html: no ${attr} on #${id}`);
  return html.replace(re, `$1${value}$2`);
};
let host = readFileSync(join(DIR, 'index.html'), 'utf8');
const total = sec(totalF);
host = setAttr(host, 'stage', 'data-duration', total);
for (const id of ['ol-ground', 'ol-captions', 'ol-veil']) host = setAttr(host, id, 'data-duration', total);
const sceneIds = [...host.matchAll(/id="(s(\d+)-[a-z-]+)"/g)].map((m) => ({ id: m[1], n: +m[2] }));
for (const fr of frames) {
  const s = sceneIds.find((x) => x.n === fr.n);
  if (!s) throw new Error(`index.html: no scene host for Frame ${fr.n} (id="s${fr.n}-…")`);
  host = setAttr(host, s.id, 'data-start', sec(fr.startF));
  host = setAttr(host, s.id, 'data-duration', sec(fr.durF));
  fr.id = s.id;
}
// Music: the whole film, 1.5 s fades. Voice: the take's own length (never past its file).
host = setAttr(host, 'ol-music', 'data-duration', total);
host = setAttr(host, 'ol-music', 'data-automation',
  JSON.stringify({ version: 1, lanes: [{ target: 'volume', points: [{ t: 0, v: 0 }, { t: 1.5, v: MUSIC }, { t: +(total - 1.5).toFixed(3), v: MUSIC }, { t: total, v: 0 }] }] }).replace(/"/g, '&quot;'));
if (voice) {
  host = host.replace(/<!-- VOICE:[\s\S]*?-->/, `<audio id="ol-voice" src="assets/voice/${voice.file.split('/').pop()}" data-start="0" data-duration="${sec(Math.floor(voice.seconds * FPS))}" data-track-index="10" data-volume="1" data-automation='{"version":1,"lanes":[{"target":"volume","points":[{"t":0,"v":0},{"t":0.05,"v":1}]}]}'></audio>`);
  host = setAttr(host, 'ol-voice', 'src', `assets/voice/${voice.file.split('/').pop()}`);
  host = setAttr(host, 'ol-voice', 'data-duration', sec(Math.floor(voice.seconds * FPS)));
}
writeFileSync(join(DIR, 'index.html'), host);

for (const file of readdirSync(join(DIR, 'compositions')).filter((x) => x.endsWith('.html'))) {
  const p = join(DIR, 'compositions', file);
  let html = readFileSync(p, 'utf8');
  const id = html.match(/id="root" data-composition-id="([^"]+)"/)?.[1];
  const dur = id === 'ol-captions' ? total : frames.find((fr) => fr.id === id) && sec(frames.find((fr) => fr.id === id).durF);
  if (!dur) continue;
  html = html.replace(/(id="root" data-composition-id="[^"]+"[^>]*?data-duration=")[^"]*(")/, `$1${dur}$2`);
  writeFileSync(p, html);
}

// ── js/captions-data.js ───────────────────────────────────────────────
const data = {
  source, fps: FPS, total: sec(totalF),
  lines: lines.map(({ n, frame, label, text, from, to, words }) => ({ n, frame, label, text, from, to, words })),
  frames: frames.map(({ n, id, startF, durF }) => ({ n, id, start: sec(startF), duration: sec(durF) })),
};
writeFileSync(join(DIR, 'js/captions-data.js'),
  `/* Generated by timing.build.mjs from ${voice ? 'voice.json' : 'SCRIPT.md (estimated timings)'}. Don't edit: run node timing.build.mjs. */\n` +
  `window.OL_CAPTIONS = ${JSON.stringify(data, null, 1)};\n`);

// ── STORYBOARD.md durations and posters ───────────────────────────────
// A poster is a settled moment, never mid-move: each frame's is pinned to a word (same marks as js/onelaunch-story.js).
const clean = (w) => w.toLowerCase().replace(/[^a-z']/g, '');
const wordIn = (frame, text) => {
  for (const L of lines.filter((l) => l.frame === frame)) {
    const w = L.words.find((x) => clean(x.text) === text);
    if (w) return L.from + w.start;
  }
  throw new Error(`timing: no "${text}" in Frame ${frame}'s narration (poster)`);
};
const POSTER = { 1: () => wordIn(1, 'onelaunch') + 1.3, 2: () => wordIn(2, 'get') - 0.75, 3: () => wordIn(3, 'public'),
  4: () => wordIn(4, 'turns') + 0.4, 5: () => wordIn(5, 'settings') + 0.75, 6: () => wordIn(6, 'free'), 7: () => Infinity };
let sb = readFileSync(join(DIR, 'STORYBOARD.md'), 'utf8');
sb = sb.replace(/^duration: .*$/m, `duration: ${total.toFixed(1)}s`);
for (const fr of frames) {
  const dur = sec(fr.durF);
  const poster = Math.min(dur - 0.1, Math.max(0.2, (POSTER[fr.n]?.() ?? Infinity) - sec(fr.startF)));
  sb = sb.replace(new RegExp(`(## Frame ${fr.n} —[\\s\\S]*?- duration: )[^\\n]*`), `$1${dur.toFixed(2)}s`);
  sb = sb.replace(new RegExp(`(## Frame ${fr.n} —[\\s\\S]*?- poster: )[^\\n]*`), `$1${poster.toFixed(2)}s`);
}
writeFileSync(join(DIR, 'STORYBOARD.md'), sb);

console.log(`timing: ${source} · ${lines.length} lines · ${total.toFixed(2)} s`);
for (const fr of frames) console.log(`  Frame ${fr.n}  ${sec(fr.startF).toFixed(2)} → ${(sec(fr.startF) + sec(fr.durF)).toFixed(2)} s  (${fr.id})`);
