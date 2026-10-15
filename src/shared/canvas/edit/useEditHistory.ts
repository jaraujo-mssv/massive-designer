import { useCallback, useEffect, useState } from "react";

interface History<T> {
  value: T;
  /** What the sheet loaded; Reset goes back to it. */
  baseline: T;
  past: T[];
  future: T[];
}

/** True while typing somewhere that has its own undo (inputs, the title). */
function isTextTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  return target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA";
}

/**
 * A canvas tool's edited data with undo and redo. `load` starts over from a
 * sheet; `commit` records an edit; `reset` returns to the loaded data (and can
 * itself be undone). Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z work anywhere except
 * inside text fields, which keep their own undo.
 */
export function useEditHistory<T>(initial: T) {
  const [h, setH] = useState<History<T>>({ value: initial, baseline: initial, past: [], future: [] });

  const load = useCallback((baseline: T) => setH({ value: baseline, baseline, past: [], future: [] }), []);

  const commit = useCallback(
    (next: T) => setH((s) => (next === s.value ? s : { ...s, value: next, past: [...s.past, s.value], future: [] })),
    [],
  );

  const undo = useCallback(
    () =>
      setH((s) =>
        s.past.length === 0
          ? s
          : { ...s, value: s.past[s.past.length - 1], past: s.past.slice(0, -1), future: [s.value, ...s.future] },
      ),
    [],
  );

  const redo = useCallback(
    () =>
      setH((s) =>
        s.future.length === 0
          ? s
          : { ...s, value: s.future[0], past: [...s.past, s.value], future: s.future.slice(1) },
      ),
    [],
  );

  const reset = useCallback(
    () => setH((s) => (s.value === s.baseline ? s : { ...s, value: s.baseline, past: [...s.past, s.value], future: [] })),
    [],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== "z" || isTextTarget(e.target)) return;
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  return {
    value: h.value,
    load,
    commit,
    undo,
    redo,
    reset,
    canUndo: h.past.length > 0,
    canRedo: h.future.length > 0,
    /** The data differs from what the sheet loaded. */
    dirty: h.value !== h.baseline,
  };
}

/**
 * While there are edits: warns before the page is closed or reloaded, and
 * returns a check for in-app actions that would throw them away.
 */
export function useDiscardGuard(dirty: boolean) {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  return useCallback(
    () => !dirty || window.confirm("Discard your edits? Download or copy them as a sheet first to keep them."),
    [dirty],
  );
}
