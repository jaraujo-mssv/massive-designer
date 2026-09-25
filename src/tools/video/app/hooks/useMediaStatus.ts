import { useEffect, useState } from "react";
import type { VideoProject } from "../types";

/** "ok" when a project needs no untracked media or its media is synced locally. */
export type MediaStatus = "ok" | "missing" | "checking";

// `?media=off` forces the deployed (no media) state for testing.
const forceOff = () => new URLSearchParams(window.location.search).get("media") === "off";

/**
 * Media is gitignored, so only a local checkout that ran `npm run video:media`
 * has it; sync-media writes assets/.synced as the marker. The dev server's SPA
 * fallback answers missing files with index.html, so the marker must parse as JSON.
 */
async function hasSyncedMedia(project: VideoProject): Promise<boolean> {
  const base = project.path.replace(/index\.html$/, "");
  try {
    const res = await fetch(`${base}assets/.synced`, { cache: "no-cache" });
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data?.files);
  } catch {
    return false;
  }
}

export function useMediaStatus(projects: VideoProject[]): Record<string, MediaStatus> {
  const [status, setStatus] = useState<Record<string, MediaStatus>>({});

  useEffect(() => {
    let cancelled = false;
    const initial: Record<string, MediaStatus> = {};
    for (const p of projects) initial[p.id] = p.media.length === 0 ? "ok" : forceOff() ? "missing" : "checking";
    setStatus(initial);

    for (const p of projects) {
      if (initial[p.id] !== "checking") continue;
      hasSyncedMedia(p).then((ok) => {
        if (!cancelled) setStatus((s) => ({ ...s, [p.id]: ok ? "ok" : "missing" }));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [projects]);

  return status;
}
