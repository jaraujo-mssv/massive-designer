// Generate a campaign's backstage photos through ElevenLabs (GPT Image 2 by default),
// or straight from Google's Nano Banana (Gemini image) with --provider=google.
//
//   npm run content:photos -- <campaign> [--who="Michael Jordan"] [--only=arrival-michael-jordan,group-selfie-rock]
//     [--print] [--dry-run] [--force] [--size=1K|2K] [--concurrency=3] [--limit=N] [--yes]
//     [--model=gpt-image|gemini-pro|gemini-flash|seedream|seedream-lite]
//   npm run content:photos -- <campaign> --provider=google [--model=pro|flash|lite] [--size=1K|2K|4K] …
//   npm run content:photos -- <campaign> --doc=portraits …
//   npm run content:photos -- <campaign> --places [--only=place-press-room] …
//
// Walks one of the campaign's photos docs (photos.md unless --doc names another, like
// portraits.md, which has its own photo style) and generates every item that has a `Prompt:` and
// no `Image:` yet (--force redoes those too). Each one gets exactly what "Copy prompt"
// in the Content tab builds: the same prompt and images from photoRequest(), loaded
// through Vite so there's one prompt builder, with each image labelled by number. The photo lands in
// public/content/<campaign>/photos/<setting>-<owner>.webp, at 1080p (see lib/webp.mjs), the prompt sent beside the
// doc in content/<campaign>/prompts/, and the item gains an `Image:` line and a tick.
//
// --places makes the campaign's place images instead: an empty reference shot of each
// recurring place (content/<campaign>/places/), saved as its first ref in refs/, which
// every photo set there then gets attached. Make those first.
//
// --print shows the prompts, --dry-run the requests; both are free and need no key.
// A real run prints the count and cost first and asks. Key: ELEVENLABS_API_KEY in .env
// (GOOGLE_AI_API_KEY with --provider=google). Seedream has no 3:2 preset, so landscape
// photos come out 4:3 from it.
// Ported from fortuna-app (scripts/art/generate.mjs).
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { createServer } from 'vite';
import * as elevenlabs from './lib/elevenlabs-image.mjs';
import * as google from './lib/nanobanana.mjs';
import { toWebp } from './lib/webp.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const die = (msg) => {
  console.error(`[photos] ${msg}`);
  process.exit(1);
};

// --- Arguments ---------------------------------------------------------------

const flags = {};
const positional = [];
for (const arg of process.argv.slice(2)) {
  const m = /^--([\w-]+)(?:=(.*))?$/.exec(arg);
  if (m) flags[m[1]] = m[2] ?? true;
  else positional.push(arg);
}
const campaignId = positional[0];
if (!campaignId) die('usage: npm run content:photos -- <campaign> [--doc=id] [--who=Name] [--only=a,b] [--print] [--dry-run] [--force] [--yes]');
const PROVIDERS = { elevenlabs, google };
const provider = flags.provider ?? 'elevenlabs';
const lib = PROVIDERS[provider];
if (!lib) die(`--provider must be one of ${Object.keys(PROVIDERS).join(' ')}`);
const { ImageError, redact, redactRequest } = lib;
const model = lib.modelId(typeof flags.model === 'string' ? flags.model : undefined);
const size = flags.size ?? '2K';
let sizes;
try {
  sizes = lib.sizesFor(model);
} catch (e) {
  die(e.message);
}
if (!sizes.includes(size)) die(`--size must be one of ${sizes.join(' ')} for ${model}`);
const concurrency = Math.max(1, Number(flags.concurrency ?? 3));
const only = typeof flags.only === 'string' ? new Set(flags.only.split(',').map((s) => s.trim())) : null;

// --- The campaign, through the Content tab's own modules ---------------------

// No config (none of these modules use the @/ alias or plugins) and no dependency scan of the whole app.
const vite = await createServer({
  configFile: false,
  root: ROOT,
  server: { middlewareMode: true },
  appType: 'custom',
  logLevel: 'error',
  optimizeDeps: { noDiscovery: true, include: [] },
});
const { CAMPAIGNS } = await vite.ssrLoadModule('/src/tools/content/app/content.ts');
const { OWNER, aspectOf, castIn, imageOf, logosFor, photoRequest, placeAspect, placePrompt, promptOf } = await vite.ssrLoadModule(
  '/src/tools/content/app/utils/photoPrompt.ts',
);
await vite.close();

const campaign = CAMPAIGNS.find((c) => c.id === campaignId);
if (!campaign) die(`no campaign "${campaignId}" (have: ${CAMPAIGNS.map((c) => c.id).join(', ')})`);
// A campaign can have several photos docs, each with its own style: --doc picks one.
const photoDocs = campaign.docs.filter((d) => d.kind === 'photos');
const doc = typeof flags.doc === 'string' ? photoDocs.find((d) => d.id === flags.doc) : (photoDocs.find((d) => d.id === 'photos') ?? photoDocs[0]);
if (!doc) die(`${campaignId} has no photos doc${typeof flags.doc === 'string' ? ` "${flags.doc}" (have: ${photoDocs.map((d) => d.id).join(', ')})` : ' (kind: photos)'}`);
const mdPath = path.join(ROOT, doc.path);
const refsDir = path.join(ROOT, 'public/content', campaignId, 'refs');
const photosDir = path.join(ROOT, 'public/content', campaignId, 'photos');
const promptsDir = path.join(ROOT, 'content', campaignId, 'prompts');

// --- File names: <setting>-<owner>, or group-<two words of the label> --------

const STOP = new Set(['a', 'an', 'and', 'around', 'at', 'from', 'in', 'massive', 'of', 'on', 'the', 'to', 'with']);
const words = (s) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]s\b/g, '')
    .replace(/\*\*[^*]+\*\*/g, ' ')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
const slug = (s) => words(s).join('-');

/** "Arrival at Massive" + "**The Rock:** …" → "arrival-the-rock"; a group shot → "group-selfie-rock". */
function nameFor(item) {
  const setting = words(item.section ?? 'photo').find((w) => !STOP.has(w)) ?? 'photo';
  const owner = OWNER.exec(item.label)?.[1];
  if (owner) return `${setting}-${slug(owner)}`;
  const label = words(item.label).filter((w) => !STOP.has(w) && w !== setting).slice(0, 2);
  return [setting, ...label].join('-');
}

const jobs = [];
const stem = (file) => file.replace(/\.\w+$/, '');

// Places: one empty reference shot each, written to refs/ under the place's first ref.
for (const place of flags.places ? campaign.places : []) {
  const file = place.refs[0]?.file;
  if (!file) {
    console.warn(`[photos] skipping ${place.path}: give it a refs: entry to save its image as`);
    continue;
  }
  if (existsSync(path.join(refsDir, file)) && !flags.force) continue;
  if (only && !only.has(stem(file)) && !only.has(place.id)) continue;
  const logos = logosFor(place.look);
  jobs.push({
    item: null,
    name: stem(file),
    out: path.join(refsDir, file),
    prompt: placePrompt(place),
    aspect: placeAspect(place),
    refs: logos.map((l, i) => ({ file: l.file, path: path.join(refsDir, l.file), label: `Image ${i + 1}: Massive ${l.label.toLowerCase()}` })),
  });
}

const items = flags.places ? [] : doc.checklist.filter((item) => promptOf(item));
const taken = new Set(items.map(imageOf).filter(Boolean).map(stem));
for (const item of items) {
  const existing = imageOf(item);
  if (existing && !flags.force) continue;
  let name = existing?.replace(/\.\w+$/, '') ?? nameFor(item);
  if (!existing) {
    const base = name;
    for (let n = 2; taken.has(name); n++) name = `${base}-${n}`;
    taken.add(name);
  }
  if (only && !only.has(name)) continue;
  if (typeof flags.who === 'string' && !castIn(item, campaign).some((c) => c.short === flags.who)) continue;
  const { text, refs } = photoRequest(item, doc, campaign);
  // The prompt numbers the images, so a missing one would shift every number after it.
  const missing = refs.filter((r) => !existsSync(path.join(refsDir, r.file)));
  if (missing.length) {
    const places = missing.some((r) => r.kind === 'place') ? ' (place images come from --places)' : '';
    console.warn(`[photos] skipping ${name}: missing ${missing.map((r) => `refs/${r.file}`).join(', ')}${places}`);
    continue;
  }
  jobs.push({
    item,
    name,
    out: path.join(photosDir, `${name}.jpg`),
    prompt: text,
    aspect: aspectOf(item),
    refs: refs.map((r) => ({ ...r, path: path.join(refsDir, r.file), label: `Image ${r.n}: ${r.label}` })),
  });
}
if (flags.limit) jobs.splice(Number(flags.limit));
if (!jobs.length) {
  const what = flags.places ? `places for ${campaignId} (places with an image are skipped` : `${doc.path} (items with an Image: are skipped`;
  console.log(`[photos] nothing to generate in ${what}${flags.force ? ')' : '; --force redoes them)'}`);
  process.exit(0);
}

/** The request as the model reads it: the prompt, then each image's label where the image goes. */
const transcript = (j) => [j.prompt, ...j.refs.map((r) => `[${r.label}: ${r.file}]`)].join('\n\n');

// --- Free paths: --print and --dry-run ---------------------------------------

if (flags.print) {
  for (const j of jobs) console.log(`\n=== ${j.name} (${j.aspect}, ${j.refs.length} refs) ===\n\n${transcript(j)}`);
  process.exit(0);
}
if (flags['dry-run']) {
  for (const j of jobs) {
    let body;
    try {
      body = redactRequest(await lib.buildRequest({ prompt: j.prompt, refs: j.refs, aspect: j.aspect, size, model }));
    } catch (e) {
      console.log(`[photos] ✗ ${j.name}: ${e.message}`);
      continue;
    }
    console.log(JSON.stringify({ name: j.name, provider, model, body }, null, 2));
  }
  process.exit(0);
}

// --- A real run ---------------------------------------------------------------

const key = lib.apiKey();
if (!key) die(`no API key: set ${lib.KEY_NAME} in the environment or in .env at the repo root (see .env.example)`);

const price = lib.PRICE[model];
const cost = price === undefined ? 'cost unknown (ElevenLabs bills in plan credits)' : `about $${(jobs.length * price).toFixed(2)}`;
console.log(`[photos] ${jobs.length} ${flags.places ? 'place image' : 'photo'}(s) in ${campaignId} with ${model} at ${size}, ${cost}:`);
for (const j of jobs) console.log(`  ${j.name}`);
if (!flags.yes) {
  if (!process.stdin.isTTY) die('not a terminal: pass --yes to confirm');
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question('Generate? [y/N] ');
  rl.close();
  if (!/^y(es)?$/i.test(answer.trim())) die('cancelled');
}

/**
 * Adds or replaces the item's `Image:` line and ticks it. Re-reads the file and finds
 * the item by its line as written, so the other jobs' writes and edits made meanwhile
 * are kept. Reading and writing synchronously keeps concurrent jobs from interleaving.
 */
function writeBack(item, file) {
  const lines = readFileSync(mdPath, 'utf8').split('\n');
  const unticked = item.source.replace(/\[[xX]\]/, '[ ]');
  const at = lines.findIndex((l) => l === item.source || l === unticked || l === unticked.replace('[ ]', '[x]'));
  if (at < 0) return false;
  lines[at] = lines[at].replace('[ ]', '[x]');
  let end = at + 1;
  while (end < lines.length && /^(\s{2,}|\t)\S/.test(lines[end]) && !/^\s*[-*] \[/.test(lines[end])) end++;
  const indent = /^\s*/.exec(lines[at + 1] ?? '')?.[0] || '  ';
  const image = lines.slice(at + 1, end).findIndex((l) => /^\s*Image:/i.test(l));
  if (image >= 0) lines[at + 1 + image] = `${indent}Image: ${file}`;
  else lines.splice(end, 0, `${indent}Image: ${file}`);
  writeFileSync(mdPath, lines.join('\n'));
  return true;
}

mkdirSync(promptsDir, { recursive: true });
const results = { done: [], blocked: [], failed: [] };
let next = 0;
async function worker() {
  while (next < jobs.length) {
    const j = jobs[next++];
    writeFileSync(path.join(promptsDir, `${j.name}.txt`), `${transcript(j)}\n`);
    try {
      const generated = await lib.generateImage({
        prompt: j.prompt,
        refs: j.refs,
        model,
        aspect: j.aspect,
        size,
        out: j.out,
        key,
      });
      const { notes } = generated;
      // Saved as a 1080p WebP like the rest; a regeneration replaces the old one.
      const webp = await toWebp(generated.file, { overwrite: true });
      const file = webp?.out ?? generated.file;
      const bytes = webp?.after ?? generated.bytes;
      // A place image is already named in its doc; a photo gets its Image: line.
      const linked = !j.item || writeBack(j.item, path.basename(file));
      console.log(`[photos] ✓ ${j.name} (${(bytes / 1024).toFixed(0)} KB)${linked ? '' : `: couldn't find its line, add "Image: ${path.basename(file)}" by hand`}`);
      if (notes) console.log(`  model said: ${notes}`);
      results.done.push(j.name);
    } catch (e) {
      const kind = e instanceof ImageError && e.kind === 'blocked' ? 'blocked' : 'failed';
      console.log(`[photos] ✗ ${j.name}: ${redact(e.message)}${e.notes ? `\n  model said: ${e.notes}` : ''}`);
      results[kind].push(j.name);
    }
  }
}
await Promise.all(Array.from({ length: Math.min(concurrency, jobs.length) }, worker));

console.log(`\n[photos] ${results.done.length} done, ${results.blocked.length} refused, ${results.failed.length} failed`);
if (results.blocked.length) console.log(`  refused (reword the prompt, or note it in the brief): ${results.blocked.join(', ')}`);
const retry = [...results.blocked, ...results.failed];
if (retry.length) console.log(`  retry: npm run content:photos -- ${campaignId}${provider !== 'elevenlabs' ? ` --provider=${provider}` : ''}${typeof flags.model === 'string' ? ` --model=${flags.model}` : ''}${flags.places ? ' --places' : ''}${typeof flags.doc === 'string' ? ` --doc=${flags.doc}` : ''} --only=${retry.join(',')}${flags.force ? ' --force' : ''}`);
process.exit(retry.length ? 1 : 0);
