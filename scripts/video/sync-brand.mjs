// Copy the shared house files from public/video-projects/_brand into each project.
// The HyperFrames CLI only serves a project's own folder, so shared files can't be
// referenced with ../_brand; every project carries a copy in lib/ and assets/brand/.
// SparkTray / BizTray template projects (meta.json kind "template") also get the
// shared tray-app kit: public/video-projects/_templates/js/* is copied into their js/.
// GIF projects (meta.json "output": "gif") also get the loop kit: _gif/lib/* into their lib/, plus
// any kits they opt into with meta.json "kits": ["machine"] (_gif/kits/<name>/* into their lib/).
//
//   node scripts/video/sync-brand.mjs [project-id...]
import { cpSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { BRAND_DIR, PROJECTS_DIR, pickProjects, readJson } from './lib/projects.mjs';

const TEMPLATES_JS = join(PROJECTS_DIR, '_templates', 'js');
const GIF_LIB = join(PROJECTS_DIR, '_gif', 'lib');
const GIF_KITS = join(PROJECTS_DIR, '_gif', 'kits');
const TRAY_BRANDS = ['sparktray', 'biztray'];

const COPIES = [
  ['lib', 'lib'],
  ['assets/brand', 'assets/brand'],
];

for (const id of pickProjects(process.argv.slice(2))) {
  for (const [from, to] of COPIES) {
    const src = join(BRAND_DIR, from);
    if (existsSync(src)) cpSync(src, join(PROJECTS_DIR, id, to), { recursive: true });
  }
  const meta = readJson(join(PROJECTS_DIR, id, 'meta.json'), {});
  if (meta.kind === 'template' && TRAY_BRANDS.includes(meta.brand) && existsSync(TEMPLATES_JS)) {
    cpSync(TEMPLATES_JS, join(PROJECTS_DIR, id, 'js'), { recursive: true });
  }
  if (meta.output === 'gif' && existsSync(GIF_LIB)) {
    cpSync(GIF_LIB, join(PROJECTS_DIR, id, 'lib'), { recursive: true });
    for (const kit of meta.kits ?? []) cpSync(join(GIF_KITS, kit), join(PROJECTS_DIR, id, 'lib'), { recursive: true });
  }
  console.log(`✓ ${id}`);
}
