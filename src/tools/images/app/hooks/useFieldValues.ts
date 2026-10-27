import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router";
import { PHOTO_ERROR, RESERVED_PARAMS, canonicalQuery, linkable, readParams } from "../../params";
import { PARAM } from "../library";
import { checkPhoto } from "../photo";
import type { FieldValues, ImageProject } from "../types";

const storageKey = (id: string) => `images:fields:${id}`;
/** Uploaded photos' file names, by field, for the line under the Photo field. */
const namesKey = (id: string) => `images:names:${id}`;

/** The Library's view keys (search and filters), which the address bar keeps beside the image and its values. */
export const VIEW_KEYS: string[] = Object.values(PARAM);

const defaultsOf = (project: ImageProject): FieldValues =>
  Object.fromEntries(project.fields.map((f) => [f.id, f.default]));

function read<T extends object>(key: string, project: ImageProject): Partial<T> {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? "{}") as T;
    // Only fields the project still has; anything new falls back to its default.
    return Object.fromEntries(Object.entries(saved).filter(([k]) => project.fields.some((f) => f.id === k))) as Partial<T>;
  } catch {
    return {};
  }
}

function write(key: string, entries: object) {
  try {
    if (Object.keys(entries).length) localStorage.setItem(key, JSON.stringify(entries));
    else localStorage.removeItem(key);
  } catch {
    // Storage full or blocked: keep the edits in memory only.
  }
}

const isLink = (v: unknown): v is string => typeof v === "string" && /^https?:\/\//i.test(v);

/** Whether a URL carries field values: any key that isn't the image or the Library's view. */
export const hasFieldParams = (params: URLSearchParams) =>
  [...params.keys()].some((k) => !RESERVED_PARAMS.includes(k.replace(/^(amp;)+/i, "")));

/**
 * A project's field values, kept in step with the address bar, so the URL always matches the screen and can be
 * shared: /images?template=<id>&<field>=<value>&… (the shapes are in ../../params.ts).
 *
 * Opening a link with values gives the template's defaults with the link's values on top, so a missing value is the
 * default; a photo link is checked through the image proxy before it's used. Opening an image without values (from
 * the Library) brings back this browser's edits, as does reloading a page whose link matches them, uploaded photos
 * included. Edits are kept per project in localStorage (a convenience only: a full or blocked storage just means
 * they don't survive). Uploaded photos can't go in a URL, so the address bar leaves them out.
 *
 * What a link gets wrong is kept per field (`errors`) and as `unknown` params, for the Fields panel to show.
 */
export function useFieldValues(project: ImageProject | null) {
  const [params, setParams] = useSearchParams();
  const [state, setState] = useState<{ id: string | null; values: FieldValues }>({ id: null, values: {} });
  const [names, setNames] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [unknown, setUnknown] = useState<string[]>([]);
  const id = project?.id ?? null;
  const values = state.id === id ? state.values : {};

  // Load when the image changes.
  useEffect(() => {
    setErrors({});
    setUnknown([]);
    if (!project) {
      setState({ id: null, values: {} });
      return;
    }
    const defaults = defaultsOf(project);
    const stored = { ...defaults, ...read<FieldValues>(storageKey(project.id), project) };
    const storedNames = read<Record<string, string>>(namesKey(project.id), project) as Record<string, string>;
    if (!hasFieldParams(params)) {
      setState({ id: project.id, values: stored });
      setNames(storedNames);
      return;
    }

    const link = readParams(project.fields, params);
    setErrors(link.errors);
    setUnknown(link.unknown);
    // A reload of the page as it was: keep everything, uploaded photos included.
    if (canonicalQuery(project.fields, linkable(stored)) === canonicalQuery(project.fields, { ...defaults, ...link.values })) {
      setState({ id: project.id, values: stored });
      setNames(storedNames);
      return;
    }
    // A new link: the defaults with its values. Photo links wait for their check.
    const photos = project.fields.filter((f) => f.type === "image" && isLink(link.values[f.id]));
    const now = { ...defaults, ...link.values };
    for (const f of photos) now[f.id] = f.default;
    setState({ id: project.id, values: now });
    setNames({});
    write(storageKey(project.id), Object.fromEntries(Object.entries(now).filter(([k, v]) => defaults[k] !== v)));
    write(namesKey(project.id), {});

    let cancelled = false;
    for (const f of photos) {
      const url = link.values[f.id] as string;
      checkPhoto(url).then((ok) => {
        if (cancelled) return;
        if (ok) update(project, f.id, url);
        else setErrors((e) => ({ ...e, [f.id]: PHOTO_ERROR }));
      });
    }
    return () => {
      cancelled = true;
    };
    // Load only when the image changes; the URL is read as it is then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // The address bar follows the values: the image, its values that can go in a link, and the Library's view.
  useEffect(() => {
    if (!project || state.id !== project.id) return;
    const query = canonicalQuery(project.fields, linkable(state.values));
    setParams(
      (prev) => {
        const next = new URLSearchParams();
        next.set("template", project.id);
        for (const k of VIEW_KEYS) if (prev.has(k)) next.set(k, prev.get(k)!);
        for (const [k, v] of new URLSearchParams(query)) next.append(k, v);
        return next.toString() === prev.toString() ? prev : next;
      },
      { replace: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  /** Sets one value and keeps it; `name` is an uploaded photo's file name. */
  function update(p: ImageProject, fieldId: string, value: string | boolean, name?: string) {
    setState((prev) => {
      if (prev.id !== p.id) return prev;
      const next = { ...prev.values, [fieldId]: value };
      const defaults = defaultsOf(p);
      write(storageKey(p.id), Object.fromEntries(Object.entries(next).filter(([k, v]) => defaults[k] !== v)));
      return { id: p.id, values: next };
    });
    setNames((prev) => {
      const next = { ...prev };
      if (name) next[fieldId] = name;
      else delete next[fieldId];
      write(namesKey(p.id), next);
      return next;
    });
    setErrors((prev) => {
      if (!(fieldId in prev)) return prev;
      const next = { ...prev };
      delete next[fieldId];
      return next;
    });
  }

  const set = useCallback(
    (fieldId: string, value: string | boolean, name?: string) => project && update(project, fieldId, value, name),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [project],
  );

  /** Shows a message under a field (a photo that didn't load, a file that isn't an image). */
  const setError = useCallback((fieldId: string, message: string) => setErrors((e) => ({ ...e, [fieldId]: message })), []);

  const reset = useCallback(() => {
    if (!project) return;
    setState({ id: project.id, values: defaultsOf(project) });
    setNames({});
    setErrors({});
    setUnknown([]);
    write(storageKey(project.id), {});
    write(namesKey(project.id), {});
  }, [project]);

  const edited = !!project && project.fields.some((f) => values[f.id] !== undefined && values[f.id] !== f.default);

  return { values, names, errors, unknown, set, setError, reset, edited };
}
