import { useCallback, useEffect, useState } from "react";
import type { FieldValues, ImageProject } from "../types";

const storageKey = (id: string) => `images:fields:${id}`;

const defaultsOf = (project: ImageProject): FieldValues =>
  Object.fromEntries(project.fields.map((f) => [f.id, f.default]));

function load(project: ImageProject): FieldValues {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey(project.id)) ?? "{}") as FieldValues;
    // Only fields the project still has; anything new falls back to its default.
    const known = Object.fromEntries(Object.entries(saved).filter(([k]) => project.fields.some((f) => f.id === k)));
    return { ...defaultsOf(project), ...known };
  } catch {
    return defaultsOf(project);
  }
}

/**
 * A project's field values: its meta.json defaults with this browser's edits on top.
 * Edits are kept per project in localStorage so they survive a reload (a convenience only:
 * a full or blocked storage just means they don't).
 */
export function useFieldValues(project: ImageProject | null) {
  const [values, setValues] = useState<FieldValues>({});
  const id = project?.id;

  useEffect(() => {
    setValues(project ? load(project) : {});
    // Reload only when the project changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = useCallback(
    (next: FieldValues) => {
      if (!project) return;
      const defaults = defaultsOf(project);
      const edits = Object.fromEntries(Object.entries(next).filter(([k, v]) => defaults[k] !== v));
      try {
        if (Object.keys(edits).length) localStorage.setItem(storageKey(project.id), JSON.stringify(edits));
        else localStorage.removeItem(storageKey(project.id));
      } catch {
        // Storage full or blocked: keep the edits in memory only.
      }
    },
    [project],
  );

  const set = useCallback(
    (fieldId: string, value: string | boolean) =>
      setValues((prev) => {
        const next = { ...prev, [fieldId]: value };
        save(next);
        return next;
      }),
    [save],
  );

  /** Lays several values over the current ones and keeps them as edits (an edit link's values). */
  const merge = useCallback(
    (more: FieldValues) =>
      setValues((prev) => {
        const next = { ...prev, ...more };
        save(next);
        return next;
      }),
    [save],
  );

  const reset = useCallback(() => {
    if (!project) return;
    const defaults = defaultsOf(project);
    setValues(defaults);
    save(defaults);
  }, [project, save]);

  const edited = !!project && project.fields.some((f) => values[f.id] !== undefined && values[f.id] !== f.default);

  return { values, set, merge, reset, edited };
}
