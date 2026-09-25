/**
 * GLSL sources for the live renderer.
 *
 * Two things keep this honest and cheap:
 *
 * 1. Everything that is uniform across a frame — the wiggle LFO, scroll
 *    intensity, drift offsets — is resolved once on the CPU by `resolveFrame()`
 *    and handed over as uniforms. The shader never re-derives it.
 * 2. The dither pass renders at the *downsampled* resolution into a
 *    framebuffer, box-filtering the source over integer texel ranges. A second
 *    pass blits it up with NEAREST filtering, so the cells stay hard-edged.
 *
 * MIRRORED COPY: `tools/dither-tuner/index.html` carries its own transcription
 * of these shaders, because a standalone HTML file cannot import TypeScript. A
 * change here that is not made there means the tuner stops predicting what the
 * site renders. There is no check enforcing this — only this comment.
 */

/** Colour mode discriminants, shared with the renderer's uniform upload. */
export const COLOR_MODE = { duotone: 0, mono: 1, palette: 2, rgb: 3 } as const
export const NOISE_TYPE = { white: 0, perlin: 1 } as const
export const POINTER_MODE = { off: 0, intensity: 1, threshold: 2, reveal: 3 } as const
export const SCROLL_MODE = { off: 0, reveal: 1, intensity: 2 } as const

/** Largest palette the shader can hold; mirrored by the preset validator. */
export const MAX_PALETTE = 16

/**
 * Largest pointer trail the shader can hold. Every sample is another radial
 * test per fragment, so this is a cost ceiling as much as a storage one.
 */
export const MAX_TRAIL = 32

/** A single triangle covering the viewport — cheaper than a quad, no seam. */
export const VERTEX_SHADER = /* glsl */ `#version 300 es
precision highp float;

out vec2 vUv;

void main() {
  vec2 position = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
  vUv = position;
  gl_Position = vec4(position * 2.0 - 1.0, 0.0, 1.0);
}
`

export const DITHER_FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
precision highp sampler2D;

uniform sampler2D uSource;
uniform sampler2D uBayer;

uniform ivec2 uSourceSize;   // full-resolution source, in texels
uniform ivec2 uCellSize;     // downsampled grid this pass renders at
uniform int uMatrixSize;

// Resolved on the CPU by resolveFrame(); never recomputed here.
uniform float uSpread;
uniform float uBrightness;
uniform float uContrast;
uniform float uGamma;
uniform float uSaturation;
uniform int uInvert;
uniform ivec2 uDrift;
uniform float uNoiseAmount;
uniform float uNoiseScale;
uniform int uNoiseZ;
uniform int uNoiseType;

uniform int uColorMode;
uniform vec3 uInk;
uniform vec3 uPaper;
uniform vec3 uPalette[${MAX_PALETTE}];
uniform int uPaletteSize;
uniform int uRgbLevels;

uniform int uPointerMode;
uniform float uPointerRadius;
uniform float uPointerStrength;
uniform vec3 uPointer;       // x, y, active
uniform vec3 uTrail[${MAX_TRAIL}];  // x, y, weight — newest first
uniform int uTrailCount;
uniform float uTrailTaper;

uniform int uScrollMode;
uniform float uScrollStrength;
uniform float uScroll;

out vec4 fragColor;

const vec3 LUMA = vec3(0.2126, 0.7152, 0.0722);

// Mirrors hash3() in ../hash.ts. The 24-bit truncation is load-bearing:
// it is the widest value a float can carry without rounding.
float hash3(int x, int y, int z) {
  uint h = uint(x) * 374761393u + uint(y) * 668265263u + uint(z) * 1442695041u;
  h = (h ^ (h >> 13u)) * 1274126177u;
  h ^= h >> 16u;
  return float(h >> 8u) / 16777216.0;
}

float fadeCurve(float t) {
  return t * t * (3.0 - 2.0 * t);
}

float valueNoise3(float x, float y, float z) {
  int xi = int(floor(x));
  int yi = int(floor(y));
  int zi = int(floor(z));
  float xf = fadeCurve(x - float(xi));
  float yf = fadeCurve(y - float(yi));
  float zf = fadeCurve(z - float(zi));

  float result = 0.0;
  for (int dz = 0; dz <= 1; dz++) {
    float wz = dz == 0 ? 1.0 - zf : zf;
    for (int dy = 0; dy <= 1; dy++) {
      float wy = dy == 0 ? 1.0 - yf : yf;
      for (int dx = 0; dx <= 1; dx++) {
        float wx = dx == 0 ? 1.0 - xf : xf;
        result += hash3(xi + dx, yi + dy, zi + dz) * wx * wy * wz;
      }
    }
  }
  return result;
}

float sampleNoise(float x, float y, int z) {
  if (uNoiseType == ${NOISE_TYPE.perlin}) return valueNoise3(x, y, float(z));
  return hash3(int(floor(x)), int(floor(y)), z);
}

vec3 preprocess(vec3 c) {
  if (uInvert == 1) c = vec3(1.0) - c;

  if (uSaturation != 1.0) {
    float l = dot(c, LUMA);
    c = vec3(l) + (c - vec3(l)) * uSaturation;
  }

  c = (c - vec3(0.5)) * uContrast + vec3(0.5) + vec3(uBrightness);

  if (uGamma != 1.0) {
    c = pow(max(c, vec3(0.0)), vec3(1.0 / uGamma));
  }

  return clamp(c, 0.0, 1.0);
}

float radialFalloff(vec2 uv, float aspect, vec2 centre, float radius) {
  vec2 delta = vec2((centre.x - uv.x) * aspect, centre.y - uv.y);
  return smoothstep(0.0, 1.0, 1.0 - length(delta) / max(radius, 1e-4));
}

// The live cursor plus its trail, combined by max() so overlapping samples
// don't stack into a brighter core than a single one would give.
float pointerFalloff(vec2 uv, float aspect) {
  float best = 0.0;
  if (uPointer.z >= 0.5) best = radialFalloff(uv, aspect, uPointer.xy, uPointerRadius);

  for (int i = 0; i < ${MAX_TRAIL}; i++) {
    if (i >= uTrailCount) break;
    vec3 entry = uTrail[i];
    // Age both dims a sample and, with taper, shrinks it.
    float radius = uPointerRadius * (1.0 - uTrailTaper * (1.0 - entry.z));
    best = max(best, radialFalloff(uv, aspect, entry.xy, radius) * entry.z);
  }

  return best;
}

float quantizeChannel(float value, float threshold, float steps) {
  float level = floor(value * steps + threshold + 0.5);
  return clamp(level, 0.0, steps) / steps;
}

void main() {
  // Flip Y so the cell grid is indexed top-down.
  ivec2 cell = ivec2(int(gl_FragCoord.x), uCellSize.y - 1 - int(gl_FragCoord.y));

  // Box filter over integer texel ranges — one output cell per source block.
  int x0 = (cell.x * uSourceSize.x) / uCellSize.x;
  int x1 = max(x0 + 1, ((cell.x + 1) * uSourceSize.x) / uCellSize.x);
  int y0 = (cell.y * uSourceSize.y) / uCellSize.y;
  int y1 = max(y0 + 1, ((cell.y + 1) * uSourceSize.y) / uCellSize.y);

  vec4 sum = vec4(0.0);
  float count = 0.0;
  for (int sy = y0; sy < y1; sy++) {
    for (int sx = x0; sx < x1; sx++) {
      sum += texelFetch(uSource, ivec2(sx, sy), 0);
      count += 1.0;
    }
  }

  vec4 source = sum / count;
  vec3 rgb = preprocess(source.rgb);

  vec2 uv = (vec2(cell) + vec2(0.5)) / vec2(uCellSize);
  float aspect = float(uCellSize.x) / float(max(uCellSize.y, 1));

  float spread = uSpread;
  float bias = 0.0;
  if (uPointerMode == ${POINTER_MODE.intensity}) {
    spread *= 1.0 + uPointerStrength * pointerFalloff(uv, aspect) * 3.0;
  } else if (uPointerMode == ${POINTER_MODE.threshold}) {
    bias += uPointerStrength * pointerFalloff(uv, aspect);
  }

  int mx = ((cell.x + uDrift.x) % uMatrixSize + uMatrixSize) % uMatrixSize;
  int my = ((cell.y + uDrift.y) % uMatrixSize + uMatrixSize) % uMatrixSize;
  float threshold = texelFetch(uBayer, ivec2(mx, my), 0).r * spread + bias;

  if (uNoiseAmount != 0.0) {
    float n = sampleNoise(float(cell.x) / uNoiseScale, float(cell.y) / uNoiseScale, uNoiseZ);
    threshold += (n - 0.5) * uNoiseAmount;
  }

  vec3 result;
  if (uColorMode == ${COLOR_MODE.palette}) {
    vec3 shifted = rgb + vec3(threshold);
    result = uPalette[0];
    float best = 1e9;
    for (int i = 0; i < ${MAX_PALETTE}; i++) {
      if (i >= uPaletteSize) break;
      vec3 delta = uPalette[i] - shifted;
      float distance = dot(delta, delta);
      if (distance < best) {
        best = distance;
        result = uPalette[i];
      }
    }
  } else if (uColorMode == ${COLOR_MODE.rgb}) {
    float steps = float(uRgbLevels - 1);
    result = vec3(
      quantizeChannel(rgb.r, threshold, steps),
      quantizeChannel(rgb.g, threshold, steps),
      quantizeChannel(rgb.b, threshold, steps)
    );
  } else {
    bool lit = dot(rgb, LUMA) + threshold >= 0.5;
    if (uColorMode == ${COLOR_MODE.duotone}) {
      result = lit ? uPaper : uInk;
    } else {
      result = lit ? vec3(1.0) : vec3(0.0);
    }
  }

  float reveal = 0.0;
  if (uPointerMode == ${POINTER_MODE.reveal}) {
    reveal = max(reveal, pointerFalloff(uv, aspect) * uPointerStrength);
  }
  if (uScrollMode == ${SCROLL_MODE.reveal}) {
    float softness = 0.02 + uScrollStrength * 0.5;
    float progress = uScroll * (1.0 + softness);
    reveal = max(reveal, smoothstep(0.0, 1.0, (progress - uv.y) / softness));
  }
  result = mix(result, rgb, clamp(reveal, 0.0, 1.0));

  fragColor = vec4(result, source.a);
}
`

/** Blits the small dithered texture to the canvas. NEAREST only — never smooth a dither. */
export const BLIT_FRAGMENT_SHADER = /* glsl */ `#version 300 es
precision highp float;
precision highp sampler2D;

uniform sampler2D uTexture;
in vec2 vUv;
out vec4 fragColor;

void main() {
  fragColor = texture(uTexture, vUv);
}
`
