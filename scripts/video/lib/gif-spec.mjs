// LinkedIn GIF spec: the strictest published limits, so a GIF animates in organic posts,
// scheduler/API posts and single image ads alike. Used by new.mjs --gif and gif.mjs;
// the checks land in each project's gif/stats.json, which the Video tab shows.

/** Canvas sizes for `npm run gif:new -- --format=…`. */
export const GIF_FORMATS = { portrait: [1080, 1350], square: [1080, 1080], wide: [1200, 628] };

export const LIMITS = {
  // "5 MB": counted in decimal megabytes, the stricter reading.
  maxBytes: 5_000_000,
  maxFrames: 250,
  seconds: [3, 6],
  fps: [10, 24],
  // 1:1, 4:5 and 1.91:1, with a little slack for 1200×628 (1.911).
  ratios: [
    { label: '1:1', value: 1 },
    { label: '4:5', value: 0.8 },
    { label: '1.91:1', value: 1.91 },
  ],
  ratioSlack: 0.01,
};

/** Encode settings, tried in order until one fits under LIMITS.maxBytes. */
export const LADDER = [
  { colors: 256, dither: 'sierra2_4a' },
  { colors: 128, dither: 'sierra2_4a' },
  { colors: 64, dither: 'sierra2_4a' },
  { colors: 64, dither: 'bayer' },
];

export const mb = (bytes) => `${(bytes / 1_000_000).toFixed(2)} MB`;

export function ratioLabel(width, height) {
  const r = width / height;
  return LIMITS.ratios.find((x) => Math.abs(r - x.value) <= LIMITS.ratioSlack)?.label ?? null;
}

/** Problems with a composition before it is rendered: errors stop the render, warnings don't. */
export function precheck({ width, height, fps, duration }) {
  const errors = [];
  const warnings = [];
  const frames = duration * fps;
  if (!Number.isInteger(Math.round(frames * 1e6) / 1e6)) {
    errors.push(`duration × fps = ${frames} isn't a whole number of frames, so the loop would stutter at the seam.`);
  }
  if (frames > LIMITS.maxFrames) {
    errors.push(`${Math.round(frames)} frames; LinkedIn stops animating over ${LIMITS.maxFrames}. Shorten it or lower data-fps.`);
  }
  if (!ratioLabel(width, height)) warnings.push(`${width}×${height} isn't 1:1, 4:5 or 1.91:1.`);
  const [minS, maxS] = LIMITS.seconds;
  if (duration < minS || duration > maxS) warnings.push(`${duration}s loop; aim for ${minS}–${maxS}s.`);
  const [minF, maxF] = LIMITS.fps;
  if (fps < minF || fps > maxF) warnings.push(`${fps} fps; aim for ${minF}–${maxF}.`);
  return { errors, warnings };
}

/** The checks shown in the Video tab, from the finished GIF. */
export function checks({ bytes, frames, fps, width, height, duration, seam }) {
  const ratio = ratioLabel(width, height);
  const [minS, maxS] = LIMITS.seconds;
  const [minF, maxF] = LIMITS.fps;
  return [
    { label: 'File size', value: mb(bytes), limit: `under ${mb(LIMITS.maxBytes)}`, ok: bytes <= LIMITS.maxBytes },
    { label: 'Frames', value: String(frames), limit: `${LIMITS.maxFrames} or fewer`, ok: frames <= LIMITS.maxFrames },
    { label: 'Shape', value: ratio ?? `${width}×${height}`, limit: '1:1, 4:5 or 1.91:1', ok: !!ratio },
    { label: 'Length', value: `${duration}s`, limit: `${minS}–${maxS}s`, ok: duration >= minS && duration <= maxS },
    { label: 'Frame rate', value: `${fps} fps`, limit: `${minF}–${maxF} fps`, ok: fps >= minF && fps <= maxF },
    { label: 'Loop seam', value: seam.ok ? 'smooth' : 'jumps', limit: 'last frame flows into the first', ok: seam.ok },
  ];
}
