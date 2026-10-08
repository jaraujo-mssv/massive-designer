// Shared by the image generators (nanobanana.mjs, elevenlabs-image.mjs): the repo-root
// .env loader and the error type photos.mjs sorts results by.
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/** `api`: the request failed. `blocked`: no image came back, usually a refusal. */
export class ImageError extends Error {
  constructor(kind, message, notes = '') {
    super(message);
    this.kind = kind;
    this.notes = notes;
  }
}

/** Minimal .env parser: KEY=VALUE, `#` comments, optional quotes. No interpolation. */
function parseEnvFile(text) {
  const out = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim().replace(/^export\s+/, '');
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
    out[key] = value;
  }
  return out;
}

/** Loads the repo-root .env into process.env; a real environment variable wins. */
export function loadEnv() {
  const file = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../.env');
  if (!existsSync(file)) return;
  for (const [k, v] of Object.entries(parseEnvFile(readFileSync(file, 'utf8')))) if (!process.env[k]) process.env[k] = v;
}
