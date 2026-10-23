// AI mockups of the merch: one top-down desk photo per product group, made through ElevenLabs (GPT Image 2) from the
// design PNGs that `npm run merch` renders. It costs plan credits, so it isn't part of `npm run merch`.
//
//   npm run merch:mockups [-- --only=button,pin] [--print] [--yes]
//
// A group's prompt is scripts/merch/mockups/<id>.txt. The script adds the list of its reference images, in the order
// they're attached (the API takes no text between images). Button and pin faces are sent cropped to the circle that
// shows on the front. The photo lands in public/merch-files/mockups/<id>.jpg, which the Merch tab shows.
// --print shows the prompts and makes the crops (in output/merch/mockup-refs/), free. Key: ELEVENLABS_IMAGE_API_KEY in
// .env, or ELEVENLABS_API_KEY when that one has the image_video_generation permission.
import { readdirSync, readFileSync, unlinkSync } from "node:fs";
import { mkdir } from "node:fs/promises";
import { createInterface } from "node:readline/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import * as elevenlabs from "../content/lib/elevenlabs-image.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..");
const pngDir = resolve(repoRoot, "public", "merch-files", "png");
const outDir = resolve(repoRoot, "public", "merch-files", "mockups");
const refsDir = resolve(repoRoot, "output", "merch", "mockup-refs");

// The groups, as the Merch tab's products name them. `art`: a round file's width in inches; its 1 in face is cropped.
const GROUPS = {
  button: { what: "the printed face of a 1-inch button", art: 1.31 },
  pin: { what: "the printed face of a 1-inch round pin", art: 1.125 },
  enamel: { what: "the design of an enamel pin, cut to its outline" },
  sticker: { what: "the design of a die-cut sticker, cut to its outline" },
};

const die = (msg) => {
  console.error(`[mockups] ${msg}`);
  process.exit(1);
};

const flags = {};
for (const arg of process.argv.slice(2)) {
  const m = /^--([\w-]+)(?:=(.*))?$/.exec(arg);
  if (!m) die(`unexpected argument: ${arg}`);
  flags[m[1]] = m[2] ?? true;
}
const only = typeof flags.only === "string" ? flags.only.split(",").map((s) => s.trim()) : Object.keys(GROUPS);
const unknown = only.filter((id) => !GROUPS[id]);
if (unknown.length) die(`no group named ${unknown.join(", ")}. Groups: ${Object.keys(GROUPS).join(", ")}`);

/** "button-logo-dark" → "Logo · Dark" */
const designName = (file, id) =>
  file
    .slice(id.length + 1)
    .split("-")
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join(" · ");

/** The 1 in face of a round print file: a centred circle on a transparent ground. */
async function faceOf(src, out, art) {
  const { width } = await sharp(src).metadata();
  const face = Math.round(width / art);
  const inset = Math.round((width - face) / 2);
  const mask = Buffer.from(`<svg width="${face}" height="${face}"><circle cx="${face / 2}" cy="${face / 2}" r="${face / 2}"/></svg>`);
  await sharp(src)
    .extract({ left: inset, top: inset, width: face, height: face })
    .composite([{ input: mask, blend: "dest-in" }])
    .png()
    .toFile(out);
  return out;
}

const jobs = [];
for (const id of only) {
  const group = GROUPS[id];
  const files = readdirSync(pngDir)
    .filter((f) => f.startsWith(`${id}-`) && f.endsWith(".png"))
    .sort()
    .map((f) => f.slice(0, -4));
  if (!files.length) die(`no ${id} designs in ${pngDir}: run npm run merch first`);
  if (group.art) await mkdir(resolve(refsDir, id), { recursive: true });
  const refs = [];
  for (const file of files) {
    const src = resolve(pngDir, `${file}.png`);
    refs.push(group.art ? await faceOf(src, resolve(refsDir, id, `${file}.png`), group.art) : src);
  }
  const list = files.map((file, i) => `Image ${i + 1}: ${group.what}, ${designName(file, id)}.`).join("\n");
  const prompt = `${readFileSync(resolve(__dirname, "mockups", `${id}.txt`), "utf8").trim()}\n\nThe reference images, in the order attached:\n${list}`;
  jobs.push({ id, refs, prompt, out: resolve(outDir, `${id}.jpg`) });
}

if (flags.print) {
  for (const j of jobs) console.log(`--- ${j.id} (${j.refs.length} refs: ${j.refs.join(", ")})\n${j.prompt}\n`);
  process.exit(0);
}

// The image key when .env has one (the general key may lack the image_video_generation permission), else the general.
const general = elevenlabs.apiKey(); // also loads .env
const key = process.env.ELEVENLABS_IMAGE_API_KEY || general;
if (!key) die(`no API key: set ELEVENLABS_IMAGE_API_KEY (or ${elevenlabs.KEY_NAME}) in the environment or in .env`);
const model = elevenlabs.DEFAULT_MODEL;
console.log(`[mockups] ${jobs.length} mockup(s) with ${model} at 2K, cost unknown (ElevenLabs bills in plan credits):`);
for (const j of jobs) console.log(`  ${j.id} (${j.refs.length} designs)`);
if (!flags.yes) {
  if (!process.stdin.isTTY) die("not a terminal: pass --yes to confirm");
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question("Generate? [y/N] ");
  rl.close();
  if (!/^y(es)?$/i.test(answer.trim())) die("cancelled");
}

await mkdir(outDir, { recursive: true });
let failed = 0;
for (const j of jobs) {
  try {
    const { file } = await elevenlabs.generateImage({ prompt: j.prompt, refs: j.refs, model, aspect: "3:2", size: "2K", out: j.out, key });
    // The tab links .jpg: anything else the API returns is re-encoded.
    if (file !== j.out) {
      await sharp(file).jpeg({ quality: 88 }).toFile(j.out);
      unlinkSync(file);
    }
    console.log(`  ✓ ${j.id} → ${j.out}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${j.id}: ${elevenlabs.redact(e.message)}`);
  }
}
if (failed) process.exit(1);
