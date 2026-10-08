// Generate an image through ElevenLabs' Image API (Seedream, Gemini, GPT Image), over REST.
// No dependencies: Node's global fetch.
//
//   node scripts/content/lib/elevenlabs-image.mjs --prompt "a red bicycle" --out out.jpg
//   node scripts/content/lib/elevenlabs-image.mjs --prompt-file p.txt --ref face.jpg --aspect 3:2 --out photo.jpg
//
// Auth: ELEVENLABS_API_KEY, from the environment or the repo-root .env.
// The same exports as nanobanana.mjs, so scripts/content/photos.mjs can use either.
// The API is asynchronous: POST /v1/flows/image starts a generation, GET polls it, and a
// finished one gives a signed URL to download the image from.
import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ImageError, loadEnv } from './env.mjs';

export { ImageError };
export const KEY_NAME = 'ELEVENLABS_API_KEY';

export const MODELS = {
  seedream: 'bytedance-seedream-5-pro', // Seedream 5 Pro: photorealism; ByteDance models need ElevenLabs to enable them for the account
  'seedream-lite': 'bytedance-seedream-5-lite', // Seedream 5 Lite: up to 3K
  'gemini-pro': 'gemini-3-pro-image', // Nano Banana Pro, through ElevenLabs
  'gemini-flash': 'gemini-3.1-flash-image', // Nano Banana 2, through ElevenLabs
  'gpt-image': 'gpt-image-2', // GPT Image 2: up to 10 references, 3:2 natively (default)
};
export const DEFAULT_MODEL = MODELS['gpt-image'];
/**
 * USD per image, for the estimate printed before a run. ElevenLabs bills in plan
 * credits, so none are known here; photos.mjs says so instead of printing $0.
 */
export const PRICE = {};
export const modelId = (alias) => MODELS[alias] ?? alias ?? DEFAULT_MODEL;

/**
 * What each model takes, from the API reference (POST /v1/flows/image). The REST API takes
 * presets only: custom_width/custom_height, which the ElevenLabs app offers for Seedream, are rejected.
 */
const SPECS = {
  'bytedance-seedream-5-pro': { aspects: ['1:1', '3:4', '4:3', '16:9', '9:16'], sizes: ['1K', '2K'], maxRefs: 10 },
  'bytedance-seedream-5-lite': { aspects: ['1:1', '3:4', '4:3', '16:9', '9:16'], sizes: ['2K', '3K'], maxRefs: 10 },
  'gemini-3-pro-image': { aspects: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9'], sizes: ['1K', '2K', '4K'], maxRefs: 10 },
  'gemini-3.1-flash-image': {
    aspects: ['1:1', '2:3', '3:2', '3:4', '4:3', '4:5', '5:4', '9:16', '16:9', '21:9', '1:4', '4:1', '1:8', '8:1'],
    sizes: ['512', '1K', '2K', '4K'],
    maxRefs: 14,
  },
  'gpt-image-2': {
    aspects: ['1:1', '4:5', '5:4', '3:4', '4:3', '2:3', '3:2', '1:2', '2:1', '9:16', '16:9', '21:9', '1:3', '3:1'],
    sizes: ['1K', '2K', '4K'],
    maxRefs: 10,
  },
};
const specOf = (model) => {
  const spec = SPECS[model];
  if (!spec) throw new ImageError('api', `unknown model "${model}" (have: ${Object.keys(MODELS).join(' ')}, or ${Object.keys(SPECS).join(' ')})`);
  return spec;
};
/** Every size any model takes; sizesFor() is the one to check against. */
export const SIZES = ['512', '1K', '2K', '3K', '4K'];
export const sizesFor = (model) => specOf(modelId(model)).sizes;

const API_BASE = 'https://api.elevenlabs.io/v1';
const MIME_BY_EXT = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.heic': 'image/heic', '.heif': 'image/heif' };
const POLL_MS = 3000;
const TIMEOUT_MS = 5 * 60 * 1000;

const warn = (msg) => console.error(`[elevenlabs-image] warning: ${msg}`);

/** Masks ElevenLabs API keys in anything printed. */
export const redact = (s) => String(s).replace(/sk_[0-9a-f]{20,}/gi, 'sk_…');

/** The API key: a real environment variable wins over the repo-root .env. Null when neither has one. */
export function apiKey() {
  loadEnv();
  return process.env.ELEVENLABS_API_KEY || null;
}

const ratioOf = (s) => {
  const [w, h] = s.split(':').map(Number);
  return w / h;
};

/**
 * The aspect fields of the request: the ratio as aspect_ratio, with resolution. A ratio the
 * model has no preset for snaps to the nearest one (3:2 on Seedream becomes 4:3).
 */
function sizing(spec, aspect, size) {
  if (!aspect || spec.aspects.includes(aspect)) return { ...(aspect ? { aspect_ratio: aspect } : {}), ...(size ? { resolution: size } : {}) };
  const target = ratioOf(aspect);
  if (!Number.isFinite(target) || target <= 0) throw new ImageError('api', `bad aspect "${aspect}" (want w:h)`);
  const best = spec.aspects.reduce((acc, c) => (Math.abs(ratioOf(c) - target) < Math.abs(ratioOf(acc) - target) ? c : acc));
  warn(`aspect "${aspect}" is not supported by this model; using nearest "${best}"`);
  return { aspect_ratio: best, ...(size ? { resolution: size } : {}) };
}

async function inlineImage(file) {
  const mimeType = MIME_BY_EXT[path.extname(file).toLowerCase()];
  if (!mimeType) throw new ImageError('api', `${file}: unsupported image type (png jpg webp heic)`);
  const data = await readFile(file);
  return { type: 'inline_base64', content_base64: data.toString('base64'), mime_type: mimeType };
}

/**
 * The POST /v1/flows/image body: the prompt, then each reference image inline, in order.
 * A ref is a path, or { path, label }. The API takes no text between images, so labels
 * aren't sent: the prompt itself lists the images by number, in the order attached.
 */
export async function buildRequest({ prompt, refs = [], aspect, size, seed, model }) {
  const id = modelId(model);
  const spec = specOf(id);
  if (size && !spec.sizes.includes(size)) throw new ImageError('api', `${id} takes size ${spec.sizes.join(' or ')}, not ${size}`);
  if (refs.length > spec.maxRefs) throw new ImageError('api', `${id} takes up to ${spec.maxRefs} reference images, this one has ${refs.length}`);
  const images = [];
  for (const ref of refs) images.push(await inlineImage(typeof ref === 'string' ? ref : ref.path));
  return {
    model_id: id,
    prompt,
    ...sizing(spec, aspect, size),
    ...(images.length ? { images } : {}),
    ...(Number.isInteger(seed) ? { seed } : {}),
  };
}

/** The request with the base64 images shortened, for --dry-run. */
export function redactRequest(body) {
  const copy = structuredClone(body);
  for (const img of copy.images ?? []) img.content_base64 = `<${img.content_base64.length} b64 chars>`;
  return copy;
}

/** One API call, retrying 429s, 5xxs and network errors with backoff. */
async function callApi({ apiKey, method = 'GET', url, body }) {
  let lastErr = 'unknown error';
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) await new Promise((r) => setTimeout(r, 1500 * 2 ** (attempt - 1)));
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: { 'xi-api-key': apiKey, ...(body ? { 'content-type': 'application/json' } : {}) },
        ...(body ? { body: JSON.stringify(body) } : {}),
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
      const json = JSON.parse(text);
      // 422s list each invalid field; other errors carry a message.
      detail = Array.isArray(json?.detail)
        ? json.detail.map((d) => `${(d.loc ?? []).join('.')}: ${d.msg}`).join('; ')
        : (json?.detail?.message ?? json?.detail ?? text);
      if (typeof detail !== 'string') detail = JSON.stringify(detail);
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

/** Polls a generation until it finishes. A moderation refusal is `blocked`, like Gemini's. */
async function waitFor({ apiKey, id }) {
  const deadline = Date.now() + TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, POLL_MS));
    const gen = await callApi({ apiKey, url: `${API_BASE}/flows/image/${id}` });
    if (gen.status === 'completed') return gen;
    if (gen.status === 'failed') {
      const message = `${gen.failure_reason ?? 'failed'}${gen.error_message ? `: ${gen.error_message}` : ''}`;
      throw new ImageError(gen.failure_reason === 'moderated' ? 'blocked' : 'api', `generation ${id} ${message}`);
    }
  }
  throw new ImageError('api', `generation ${id} still not done after ${TIMEOUT_MS / 60000} minutes`);
}

/**
 * Generate one image and write it to `out`. The extension follows the format the
 * API returns, so the written path is returned.
 */
export async function generateImage({ prompt, refs, model = DEFAULT_MODEL, aspect, size, seed, out, key }) {
  const body = await buildRequest({ prompt, refs, aspect, size, seed, model });
  const { id } = await callApi({ apiKey: key, method: 'POST', url: `${API_BASE}/flows/image`, body });
  const gen = await waitFor({ apiKey: key, id });
  // A signed URL: no key needed, and it expires about an hour after the poll.
  const res = await fetch(gen.content_url);
  if (!res.ok) throw new ImageError('api', `download of generation ${id} failed: HTTP ${res.status}`);
  const mimeType = gen.content_mime_type ?? res.headers.get('content-type');
  const ext = Object.entries(MIME_BY_EXT).find(([, m]) => m === mimeType)?.[0] ?? '.png';
  const file = out.replace(/\.\w+$/, '') + ext;
  const buf = Buffer.from(await res.arrayBuffer());
  await mkdir(path.dirname(path.resolve(file)), { recursive: true });
  await writeFile(file, buf);
  return { file, bytes: buf.length, notes: '' };
}

// One-off CLI: --prompt | --prompt-file, --out, [--ref …] [--aspect] [--size] [--model] [--seed] [--dry-run]
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const die = (msg, code = 1) => {
    console.error(`[elevenlabs-image] ${msg}`);
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
      console.log(JSON.stringify({ out: args.out, body: redactRequest(await buildRequest(args)) }, null, 2));
    } else {
      const key = apiKey();
      if (!key) throw new ImageError('api', 'no API key: set ELEVENLABS_API_KEY in the environment or the repo-root .env');
      const { file, bytes } = await generateImage({ ...args, key });
      console.error(`[elevenlabs-image] wrote ${file} (${(bytes / 1024).toFixed(0)} KB)`);
    }
  } catch (e) {
    die(redact(e.message), e.kind === 'blocked' ? 3 : 2);
  }
}
