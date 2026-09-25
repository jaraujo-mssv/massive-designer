// Record a project's narration with ElevenLabs in ONE request (one performance).
//
//   ELEVENLABS_API_KEY=… node scripts/video/record-voice.mjs <project-id> [--dry-run]
//
// Reads the spoken (4-space indented) blocks of the project's SCRIPT.md, sends them
// joined by blank lines to /with-timestamps, and writes:
//   assets/voice/take-<hash>.mp3   the take (untracked media, like every asset)
//   voice.json                     tracked: settings, per-line cues, per-word timings
// Cue boundaries sit at the midpoint of the pause between two lines, so scene cuts
// land in silence. Costs ElevenLabs credits: the character count prints first.
// Ported from sparktray-campaign/scripts/record-voice.mjs.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { PROJECTS_DIR, pickProjects } from './lib/projects.mjs';

export const VOICE_SETTINGS = {
  voiceId: 'v3p1kjzUvro6S76qmYmH',
  voiceName: 'Mark - Solid, Clear and Dependable',
  modelId: 'eleven_v3',
  stability: 0.55,
  similarityBoost: 0.75,
  style: 0,
  speed: 1.0,
  outputFormat: 'mp3_44100_192',
  seed: 20260806,
};

const SEPARATOR = '\n\n';
const round = (n) => Math.round(n * 1000) / 1000;
const die = (msg) => {
  console.error(`[voice] ${msg}`);
  process.exit(1);
};

/** Spoken lines from SCRIPT.md: each "## Line" section's indented block, whitespace collapsed. */
function scriptLines(md) {
  return md
    .split(/^## /m)
    .slice(1)
    .map((section) => {
      const [heading, ...rest] = section.split('\n');
      const spoken = rest
        .filter((l) => /^( {4}|\t)/.test(l) && l.trim())
        .map((l) => l.trim())
        .join(' ')
        .replace(/\s+/g, ' ');
      return { heading: heading.trim(), text: spoken };
    })
    .filter((l) => l.text);
}

/** Words with real times for one character range, skipping [audio tags] (which can contain spaces). */
function wordsIn(align, from, to, origin) {
  const words = [];
  let current = null;
  let inTag = false;
  for (let i = from; i < to; i++) {
    const ch = align.characters[i];
    if (ch === '[') inTag = true;
    if (inTag || /\s/.test(ch)) {
      if (current) words.push(current);
      current = null;
      if (ch === ']') inTag = false;
      continue;
    }
    if (!current) current = { text: ch, start: round(align.character_start_times_seconds[i] - origin), end: 0 };
    else current.text += ch;
    current.end = round(align.character_end_times_seconds[i] - origin);
  }
  if (current) words.push(current);
  return words;
}

const args = process.argv.slice(2);
const id = args.find((a) => !a.startsWith('--'));
if (!id) die('usage: npm run video:voice <project-id> [--dry-run]');
pickProjects([id]);

const dir = join(PROJECTS_DIR, id);
const scriptPath = join(dir, 'SCRIPT.md');
if (!existsSync(scriptPath)) die(`${id} has no SCRIPT.md.`);
const lines = scriptLines(readFileSync(scriptPath, 'utf8'));
if (!lines.length) die('SCRIPT.md has no spoken lines (indent the spoken text by 4 spaces under each "## Line" heading).');

const text = lines.map((l) => l.text).join(SEPARATOR);
const hash = createHash('sha1').update(text).digest('hex').slice(0, 8);
console.log(`[voice] ${id}: ${lines.length} lines, ${text.length} characters, one request`);
console.log(`[voice]   ${VOICE_SETTINGS.voiceName} · ${VOICE_SETTINGS.modelId} · seed ${VOICE_SETTINGS.seed}`);
if (args.includes('--dry-run')) process.exit(0);

const KEY = process.env.ELEVENLABS_API_KEY;
if (!KEY) die('ELEVENLABS_API_KEY is not set.');

const res = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_SETTINGS.voiceId}/with-timestamps?output_format=${VOICE_SETTINGS.outputFormat}`,
  {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'content-type': 'application/json' },
    body: JSON.stringify({
      text,
      model_id: VOICE_SETTINGS.modelId,
      seed: VOICE_SETTINGS.seed,
      // Normalization would rewrite the text out from under the alignment indices.
      apply_text_normalization: 'off',
      voice_settings: {
        stability: VOICE_SETTINGS.stability,
        similarity_boost: VOICE_SETTINGS.similarityBoost,
        style: VOICE_SETTINGS.style,
        speed: VOICE_SETTINGS.speed,
        use_speaker_boost: true,
      },
    }),
  },
);
if (!res.ok) die(`ElevenLabs returned ${res.status} ${res.statusText}\n${(await res.text()).slice(0, 600)}`);

const body = await res.json();
const align = body.alignment;
if (!body.audio_base64 || !align?.characters?.length) die('response had no audio or no character alignment.');
if (align.characters.join('') !== text) die('alignment does not match the text sent; cues cannot be placed.');

const file = `assets/voice/take-${hash}.mp3`;
mkdirSync(join(dir, 'assets/voice'), { recursive: true });
writeFileSync(join(dir, file), Buffer.from(body.audio_base64, 'base64'));
const seconds = round(
  Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', join(dir, file)], { encoding: 'utf8' })),
);

// Character span of each line inside the joined request.
let at = 0;
const spans = lines.map((l) => {
  const span = [at, at + l.text.length];
  at += l.text.length + SEPARATOR.length;
  return span;
});
const first = spans.map(([s]) => align.character_start_times_seconds[s]);
const last = spans.map(([, e]) => align.character_end_times_seconds[e - 1]);
const cues = lines.map((l, i) => {
  const from = i === 0 ? 0 : round((last[i - 1] + first[i]) / 2);
  const to = i === lines.length - 1 ? seconds : round((last[i] + first[i + 1]) / 2);
  return { n: i + 1, heading: l.heading, from, to, text: l.text, words: wordsIn(align, spans[i][0], spans[i][1], from) };
});
const leaked = cues.flatMap((c) => c.words.filter((w) => /[[\]]/.test(w.text)));
if (leaked.length) die(`audio tags leaked into word timings: ${leaked.map((w) => w.text).join(', ')}`);

writeFileSync(
  join(dir, 'voice.json'),
  `${JSON.stringify({ file, seconds, ...VOICE_SETTINGS, requestId: res.headers.get('request-id'), lines: cues }, null, 2)}\n`,
);
// The take only exists on this machine; mark the project's media as present here.
writeFileSync(join(dir, 'assets/.synced'), `${JSON.stringify({ files: [file] }, null, 2)}\n`);

console.log(`[voice] ${seconds}s → ${id}/${file}`);
for (const c of cues) console.log(`[voice]   line ${String(c.n).padStart(2, '0')}  ${c.from.toFixed(2)}s → ${c.to.toFixed(2)}s  ${c.heading}`);
console.log('[voice] voice.json written; place <audio src="' + file + '"> in index.html and time frames to these cues.');
