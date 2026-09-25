// Shared paths and project discovery for the video scripts.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
export const PROJECTS_DIR = join(ROOT, 'public/video-projects');
export const BRAND_DIR = join(PROJECTS_DIR, '_brand');
export const OUTPUT_DIR = join(ROOT, 'output/video');
export const HF_VERSION = '0.8.77';

/** Every project folder: a direct child of public/video-projects with an index.html, not `_`-prefixed. */
export function listProjects() {
  return readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .filter((d) => existsSync(join(PROJECTS_DIR, d.name, 'index.html')))
    .map((d) => d.name)
    .sort();
}

/** Resolve CLI ids to project names, exiting on unknown ids. */
export function pickProjects(ids) {
  const all = listProjects();
  if (!ids.length) return all;
  const unknown = ids.filter((id) => !all.includes(id));
  if (unknown.length) {
    console.error(`Unknown project(s): ${unknown.join(', ')}\nKnown: ${all.join(', ')}`);
    process.exit(1);
  }
  return ids;
}

export function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  return JSON.parse(readFileSync(path, 'utf8'));
}
