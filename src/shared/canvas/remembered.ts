import { useCallback, useState } from 'react';

/**
 * Small per-browser preferences for the canvas tools: the version, theme and
 * layout used last time, kept in localStorage. Storage can be blocked or
 * cleared (private windows, previews), so a read falls back to the default and
 * a write may not stick: the tool still works for the visit.
 */

/** The value remembered under `key`, if it's still one of `allowed`. */
export function readRemembered<T extends string>(key: string, allowed: readonly T[]): T | null {
  try {
    const value = localStorage.getItem(key);
    return value !== null && (allowed as readonly string[]).includes(value) ? (value as T) : null;
  } catch {
    return null;
  }
}

export function remember(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Blocked storage: the choice holds for this visit only.
  }
}

/** useState that starts from what was remembered under `key` (else `fallback`) and remembers each change. */
export function useRemembered<T extends string>(key: string, fallback: T, allowed: readonly T[]) {
  const [value, setValue] = useState<T>(() => readRemembered(key, allowed) ?? fallback);
  const set = useCallback(
    (next: T) => {
      setValue(next);
      remember(key, next);
    },
    [key],
  );
  return [value, set] as const;
}
