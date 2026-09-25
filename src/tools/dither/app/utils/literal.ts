import { definePreset } from '@/shared/dither/presets';
import type { LivePreset } from '@/shared/dither/types';

/** Serialises a value the way it would be hand-written in a constants file. */
function toLiteral(value: unknown, indent: number): string {
  const pad = '  '.repeat(indent);
  if (Array.isArray(value)) return `[${value.map((v) => JSON.stringify(v)).join(', ')}]`;
  if (value && typeof value === 'object') {
    const inner = Object.entries(value)
      .map(([k, v]) => `${pad}  ${k}: ${toLiteral(v, indent + 1)}`)
      .join(',\n');
    return `{\n${inner},\n${pad}}`;
  }
  return JSON.stringify(value);
}

/**
 * The TypeScript to paste over `DEFAULT_DITHER_PRESET` in
 * `shared/dither/preset-store.ts`, so a tuned preset can be committed instead of
 * living only in one browser's localStorage.
 *
 * `version` is dropped because `definePreset` sets it.
 */
export function exportPresetSource(preset: LivePreset): string {
  const { version: _version, ...rest } = preset;
  const body = Object.entries(rest)
    .map(([k, v]) => `  ${k}: ${toLiteral(v, 1)}`)
    .join(',\n');
  return `export const DEFAULT_DITHER_PRESET: LivePreset = definePreset({\n${body},\n})\n`;
}

/**
 * Accepts either bare JSON or a pasted `definePreset({…})` literal — the second
 * is what the export button produces, and pasting it straight back is the
 * obvious thing to try.
 */
export function parsePresetSource(raw: string): LivePreset | null {
  const text = raw.trim();
  if (!text) return null;
  try {
    const json = text.startsWith('{')
      ? text
      : text.slice(text.indexOf('{'), text.lastIndexOf('}') + 1);
    const parsed = JSON.parse(
      json
        .replace(/(\w+):/g, '"$1":')
        .replace(/'/g, '"')
        .replace(/,(\s*[}\]])/g, '$1'),
    );
    return definePreset(parsed);
  } catch {
    return null;
  }
}
