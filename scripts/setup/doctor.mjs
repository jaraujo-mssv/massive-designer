// Is this machine ready to make Massive designs? Checks what `npm install` doesn't cover.
//
//   npm run doctor               every check, in plain language
//   npm run doctor -- --quiet    only what's missing, offline and fast (the SessionStart hook runs this)
//   npm run setup                the checks, then fixes what it can here: npm packages, Chromium, the
//                                HyperFrames browser and skills, video media. Node, FFmpeg, keys and
//                                GitHub are printed as steps for you.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadEnv } from '../content/lib/env.mjs';

const ROOT = resolve(fileURLToPath(import.meta.url), '../../..');
const VIDEO_DIR = join(ROOT, 'public/video-projects');
const args = process.argv.slice(2);
const QUIET = args.includes('--quiet');
const FIX = args.includes('--fix');

const runs = (cmd, a) => spawnSync(cmd, a, { stdio: 'ignore', cwd: ROOT }).status === 0;
const readJson = (p, fallback) => (existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : fallback);

async function chromiumPath() {
  try {
    const { chromium } = await import('playwright');
    return chromium.executablePath();
  } catch {
    return null;
  }
}

/** Video projects whose media.json lists files that aren't on disk. */
function projectsMissingMedia() {
  return readdirSync(VIDEO_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith('_'))
    .map((d) => d.name)
    .filter((id) => readJson(join(VIDEO_DIR, id, 'media.json'), []).some((m) => !existsSync(join(VIDEO_DIR, id, m.to))));
}

loadEnv();
const node = Number(process.versions.node.split('.')[0]);
const wantNode = Number(readFileSync(join(ROOT, '.nvmrc'), 'utf8').trim());
const skillDirs = [join(homedir(), '.claude/skills'), join(ROOT, '.claude/skills')];

// Each check: ok(), what it's for, and either `fix` (a command setup runs) or `todo` (a step for the person).
// `optional` checks only unlock one thing; they never fail the run.
const CHECKS = [
  {
    name: `Node ${wantNode}`,
    for: 'everything',
    ok: () => node >= wantNode,
    todo: `install Node ${wantNode} (with nvm: nvm install ${wantNode}), then npm install. This is Node ${process.versions.node}.`,
  },
  {
    name: 'npm packages',
    for: 'everything',
    ok: () => existsSync(join(ROOT, 'node_modules/playwright')) && existsSync(join(ROOT, 'node_modules/hyperframes')),
    fix: ['npm', ['install', '--no-audit', '--no-fund']],
  },
  {
    name: 'Playwright Chromium',
    for: 'rendering images, decks and PDFs',
    ok: async () => {
      const path = await chromiumPath();
      return !!path && existsSync(path);
    },
    fix: ['npx', ['playwright', 'install', 'chromium']],
  },
  {
    name: 'FFmpeg',
    for: 'rendering videos and GIFs',
    ok: () => runs('ffmpeg', ['-version']) && runs('ffprobe', ['-version']),
    todo: 'brew install ffmpeg',
  },
  {
    name: 'HyperFrames browser',
    for: 'rendering videos and GIFs',
    ok: () => existsSync(join(homedir(), '.cache/hyperframes/chrome')),
    fix: ['npx', ['hyperframes', 'browser', 'ensure']],
  },
  {
    name: 'HyperFrames skills',
    for: 'Claude making videos and GIFs',
    ok: () => skillDirs.some((dir) => existsSync(join(dir, 'hyperframes/SKILL.md'))),
    fix: ['npx', ['hyperframes', 'skills']],
  },
  {
    name: 'Video media',
    for: 're-rendering the existing videos',
    optional: true,
    ok: () => projectsMissingMedia().length === 0,
    detail: () => `missing in ${projectsMissingMedia().join(', ')}`,
    fix: ['npm', ['run', 'video:media']],
  },
  {
    name: 'ELEVENLABS_API_KEY',
    for: 'voiceovers (video:voice) and AI photos (content:photos)',
    optional: true,
    ok: () => !!process.env.ELEVENLABS_API_KEY,
    todo: 'add it to .env (see .env.example)',
  },
  {
    name: 'GOOGLE_AI_API_KEY',
    for: 'Gemini photos (content:photos -- --provider=google)',
    optional: true,
    ok: () => !!(process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY),
    todo: 'add it to .env (see .env.example)',
  },
  {
    name: 'Git name and email',
    for: 'saving your designs',
    optional: true,
    ok: () => runs('git', ['config', 'user.email']) && runs('git', ['config', 'user.name']),
    todo: 'git config --global user.name "Your Name" && git config --global user.email you@joinmassive.com',
  },
  {
    name: 'GitHub CLI',
    for: 'opening a pull request with your designs',
    optional: true,
    // `gh auth status` goes to the network; quiet mode only checks that gh is there.
    ok: () => runs('gh', ['--version']) && (QUIET || runs('gh', ['auth', 'status'])),
    todo: 'brew install gh && gh auth login',
  },
];

async function check(c) {
  return { ...c, passed: await c.ok() };
}

let results = await Promise.all(CHECKS.map(check));

if (FIX) {
  for (const r of results) {
    if (r.passed || !r.fix) continue;
    const [cmd, a] = r.fix;
    console.log(`\n→ ${r.name}: ${cmd} ${a.join(' ')}`);
    spawnSync(cmd, a, { stdio: 'inherit', cwd: ROOT });
  }
  results = await Promise.all(CHECKS.map(check));
}

const missing = results.filter((r) => !r.passed && !r.optional);
const unlocks = results.filter((r) => !r.passed && r.optional);
const how = (r) => (r.fix ? `npm run setup does it (${r.fix[0]} ${r.fix[1].join(' ')})` : r.todo);

if (QUIET) {
  // Read by Claude at the start of a session: say what's missing and what to do, or nothing at all.
  if (missing.length) {
    console.log(`Setup check: ${missing.length} thing(s) missing on this machine.`);
    for (const r of missing) console.log(`- ${r.name}, needed for ${r.for}: ${how(r)}`);
    console.log('Tell the user before starting work that needs these, and offer to run `npm run setup`.');
  }
  process.exit(0);
}

console.log(`\nMassive Designer · ${FIX ? 'setup' : 'setup check'}\n`);
for (const r of results) {
  if (r.passed) {
    console.log(`  ✓ ${r.name}`);
  } else {
    const detail = r.detail ? ` (${r.detail()})` : '';
    console.log(`  ${r.optional ? '·' : '✗'} ${r.name}${detail}: ${r.optional ? 'optional, ' : ''}for ${r.for}`);
    console.log(`      ${FIX && r.fix ? 'still missing after the fix; see the output above' : how(r)}`);
  }
}
console.log(
  missing.length
    ? `\n${missing.length} thing(s) missing.${FIX ? '' : ' Run npm run setup to fix what can be fixed here.'}\n`
    : '\nReady to design.\n',
);
process.exit(missing.length ? 1 : 0);
