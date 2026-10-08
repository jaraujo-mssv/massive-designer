// Generate an image with Google's Nano Banana models (Gemini image) over the REST API.
// No dependencies: Node's global fetch.
//
//   node scripts/content/lib/nanobanana.mjs --prompt "a red bicycle" --out out.jpg
//   node scripts/content/lib/nanobanana.mjs --prompt-file p.txt --ref face.jpg --aspect 3:2 --out photo.jpg
//
// Auth: GOOGLE_AI_API_KEY (or GEMINI_API_KEY), from the environment or the repo-root .env.
// Ported from fortuna-app (scripts/art/lib/nanobanana.mjs): exported as generateImage()
// for scripts/content/photos.mjs, which throws instead of exiting, and no --png/sharp.
import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ImageError, loadEnv } from './env.mjs';

export const MODELS = {
  'nano-banana-pro': 'gemini-3-pro-image', // Nano Banana Pro: best likeness across many refs (default)
  'nano-banana-2': 'gemini-3.1-flash-image', // Nano Banana 2
  'nano-banana-2-lite': 'gemini-3.1-flash-lite-image', // Nano Banana 2 Lite (1K only)
  'nano-banana': 'gemini-2.5-flash-image', // Nano Banana (original)
  pro: 'gemini-3-pro-image',
  flash: 'gemini-3.1-flash-image',
  lite: 'gemini-3.1-flash-lite-image',
};
export const DEFAULT_MODEL = MODELS.pro;
/** USD per image, for the estimate printed before a run. */
export const PRICE = {
  'gemini-3-pro-image': 0.14,
  'gemini-3.1-flash-image': 0.04,
  'gemini-3.1-flash-lite-image': 0.01,
  'gemini-2.5-flash-image': 0.04,
};
export const modelId = (alias) => MODELS[alias] ?? alias ?? DEFAULT_MODEL;

const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';
/** Aspect ratios imageConfig accepts. Anything else is snapped to the nearest. */
const ASPECTS = ['1:1', '1:4', '4:1', '1:8', '8:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'];
export const SIZES = ['512', '1K', '2K', '4K'];
/** The sizes a model takes: the same for every Gemini model here. */
export const sizesFor = () => SIZES;
const MIME_BY_EXT = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif' };

export { ImageError };
export const KEY_NAME = 'GOOGLE_AI_API_KEY';

const warn = (msg) => console.error(`[nanobanana] warning: ${msg}`);

/** Masks Google API keys in anything printed. */
export const redact = (s) => String(s).replace(/AIza[0-9A-Za-z_-]{20,}/g, 'AIza…');

/** The API key: a real environment variable wins over the repo-root .env. Null when neither has one. */
export function apiKey() {
  loadEnv();
  return process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY || null;
}

const ratioOf = (s) => {
  const [w, h] = s.split(':').map(Number);
  return w / h;
};

/** Snap an unsupported ratio to the nearest legal one. */
function normalizeAspect(aspect) {
  if (!aspect || ASPECTS.includes(aspect)) return aspect || undefined;
  const target = ratioOf(aspect);
  if (!Number.isFinite(target) || target <= 0) throw new ImageError('api', `bad aspect "${aspect}" (want w:h, one of ${ASPECTS.join(' ')})`);
  const best = ASPECTS.reduce((acc, c) => (Math.abs(ratioOf(c) - target) < Math.abs(ratioOf(acc) - target) ? c : acc));
  warn(`aspect "${aspect}" is not supported by the API; using nearest "${best}"`);
  return best;
}

async function inlineImage(file) {
  const mimeType = MIME_BY_EXT[path.extname(file).toLowerCase()];
  if (!mimeType) throw new ImageError('api', `${file}: unsupported image type (png jpg webp gif)`);
  const data = await readFile(file);
  return { inline_data: { mime_type: mimeType, data: data.toString('base64') } };
}

/**
 * The generateContent request body: the prompt, then each reference image inline.
 * A ref is a path, or { path, label }: a label goes in as a text part right before
 * its image ("Image 3: John Cena, face"), so the model can tell whose image is whose.
 */
export async function buildRequest({ prompt, refs = [], aspect, size, seed }) {
  if (size && !SIZES.includes(size)) throw new ImageError('api', `size must be one of ${SIZES.join(' ')}`);
  const parts = [{ text: prompt }];
  for (const ref of refs) {
    if (typeof ref !== 'string' && ref.label) parts.push({ text: ref.label });
    parts.push(await inlineImage(typeof ref === 'string' ? ref : ref.path));
  }
  const imageConfig = {};
  const ratio = normalizeAspect(aspect);
  if (ratio) imageConfig.aspectRatio = ratio;
  if (size) imageConfig.imageSize = size;
  return {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      responseModalities: ['IMAGE'],
      ...(Object.keys(imageConfig).length ? { imageConfig } : {}),
      ...(Number.isInteger(seed) ? { seed } : {}),
    },
  };
}

/** The request with the base64 images shortened, for --dry-run. */
export function redactRequest(body) {
  const copy = structuredClone(body);
  for (const p of copy.contents[0].parts) if (p.inline_data) p.inline_data.data = `<${p.inline_data.data.length} b64 chars>`;
  return copy;
}

/** One generateContent call, retrying 429s, 5xxs and network errors with backoff. */
async function callApi({ apiKey, model, body }) {
  const url = `${API_BASE}/models/${model}:generateContent`;
  let lastErr = 'unknown error';
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 1500 * 2 ** (attempt - 1)));
    let res;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
        body: JSON.stringify(body),
      });
    } catch (e) {
      lastErr = `network error: ${e.message}`;
      warn(`${lastErr}, retrying`);
      continue;
    }
    const text = await res.text();
    if (res.ok) {
      try {
        return JSON.parse(text);
      } catch {
        throw new ImageError('api', `could not parse API response: ${text.slice(0, 400)}`);
      }
    }
    let detail = text;
    try {
      detail = JSON.parse(text)?.error?.message ?? text;
    } catch {
      /* keep the raw body */
    }
    lastErr = `HTTP ${res.status}: ${detail}`;
    // 429 / 5xx are worth another go; any other 4xx is our request being wrong.
    if (res.status === 429 || res.status >= 500) {
      warn(`${lastErr}, retrying`);
      continue;
    }
    throw new ImageError('api', lastErr);
  }
  throw new ImageError('api', `gave up after retries: ${lastErr}`);
}

/** The first image part of a response, plus any prose the model returned. */
function extractImage(json) {
  const cand = json?.candidates?.[0];
  const parts = cand?.content?.parts ?? [];
  const inline = parts.find((p) => p.inlineData || p.inline_data);
  const data = inline?.inlineData ?? inline?.inline_data;
  return {
    notes: parts.filter((p) => p.text).map((p) => p.text.trim()).join('\n'),
    data: data?.data,
    mimeType: data?.mimeType ?? data?.mime_type,
    finishReason: cand?.finishReason,
    blockReason: json?.promptFeedback?.blockReason,
  };
}

/**
 * Generate one image and write it to `out`. The extension follows the format the
 * API returns (the models mostly return JPEG), so the written path is returned.
 */
export async function generateImage({ prompt, refs, model = DEFAULT_MODEL, aspect, size, seed, out, key }) {
  const body = await buildRequest({ prompt, refs, aspect, size, seed });
  const json = await callApi({ apiKey: key, model: modelId(model), body });
  const { data, mimeType, notes, finishReason, blockReason } = extractImage(json);
  if (!data) throw new ImageError('blocked', `no image returned (${blockReason || finishReason || 'no image part'})`, notes);
  const ext = Object.entries(MIME_BY_EXT).find(([, m]) => m === mimeType)?.[0] ?? '.png';
  const file = out.replace(/\.\w+$/, '') + ext;
  const buf = Buffer.from(data, 'base64');
  await mkdir(path.dirname(path.resolve(file)), { recursive: true });
  await writeFile(file, buf);
  return { file, bytes: buf.length, notes };
}

// One-off CLI: --prompt | --prompt-file, --out, [--ref …] [--aspect] [--size] [--model] [--seed] [--dry-run]
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const die = (msg, code = 1) => {
    console.error(`[nanobanana] ${msg}`);
    process.exit(code);
  };
  const args = { refs: [] };
  const argv = process.argv.slice(2);
  for (let i = 0; i < argv.length; i++) {
    const flag = argv[i];
    const value = () => argv[++i];
    if (flag === '--prompt') args.prompt = value();
    else if (flag === '--prompt-file') args.prompt = readFileSync(value(), 'utf8').trim();
    else if (flag === '--out') args.out = value();
    else if (flag === '--ref') args.refs.push(value());
    else if (flag === '--aspect') args.aspect = value();
    else if (flag === '--size') args.size = value();
    else if (flag === '--model') args.model = value();
    else if (flag === '--seed') args.seed = Number(value());
    else if (flag === '--dry-run') args.dryRun = true;
    else die(`unexpected argument: ${flag}`);
  }
  if (!args.prompt || !args.out) die('--prompt (or --prompt-file) and --out are required');
  try {
    if (args.dryRun) {
      console.log(JSON.stringify({ model: modelId(args.model), out: args.out, body: redactRequest(await buildRequest(args)) }, null, 2));
    } else {
      const key = apiKey();
      if (!key) throw new ImageError('api', 'no API key: set GOOGLE_AI_API_KEY in the environment or the repo-root .env');
      const { file, bytes, notes } = await generateImage({ ...args, key });
      if (notes) console.error(`[nanobanana] model said: ${notes}`);
      console.error(`[nanobanana] wrote ${file} (${(bytes / 1024).toFixed(0)} KB)`);
    }
  } catch (e) {
    die(`${redact(e.message)}${e.notes ? `\n  model said: ${e.notes}` : ''}`, e.kind === 'blocked' ? 3 : 2);
  }
}
