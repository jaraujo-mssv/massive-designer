// Copy the shared house files from public/video-projects/_brand into each project.
// The HyperFrames CLI only serves a project's own folder, so shared files can't be
// referenced with ../_brand; every project carries a copy in lib/ and assets/brand/.
//
//   node scripts/video/sync-brand.mjs [project-id...]
import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { BRAND_DIR, PROJECTS_DIR, pickProjects } from './lib/projects.mjs';

const COPIES = [
  ['lib', 'lib'],
  ['assets/brand', 'assets/brand'],
];

for (const id of pickProjects(process.argv.slice(2))) {
  for (const [from, to] of COPIES) {
    const src = join(BRAND_DIR, from);
    if (existsSync(src)) cpSync(src, join(PROJECTS_DIR, id, to), { recursive: true });
  }
  console.log(`✓ ${id}`);
}
