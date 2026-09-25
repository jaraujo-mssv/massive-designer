// Open HyperFrames Studio on one project for editing and storyboard review.
//
//   node scripts/video/preview.mjs <project-id>
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { HF_VERSION, PROJECTS_DIR, ROOT, listProjects, pickProjects } from './lib/projects.mjs';

const [id] = process.argv.slice(2);
if (!id) {
  console.error(`Usage: npm run video:preview <project-id>\nProjects: ${listProjects().join(', ')}`);
  process.exit(1);
}
pickProjects([id]);
spawnSync('node', ['scripts/video/sync-brand.mjs', id], { cwd: ROOT, stdio: 'inherit' });
const { status } = spawnSync('npx', ['--yes', `hyperframes@${HF_VERSION}`, 'preview'], {
  cwd: join(PROJECTS_DIR, id),
  stdio: 'inherit',
});
process.exit(status ?? 0);
