import { useEffect, useState } from "react";
import type { VideoProject } from "../types";

/** "ok" when a project needs no media or every file it needs is here. */
export type MediaStatus = "ok" | "missing" | "checking";

// `?media=off` forces the deployed (no media) state for testing.
const forceOff = () => new URLSearchParams(window.location.search).get("media") === "off";

/**
 * Media is committed, so a checkout has it unless a file was never added. The dev
 * server's SPA fallback answers missing files with index.html, so a file only counts
 * when it comes back as something other than HTML.
 */
async function hasMedia(project: VideoProject): Promise<boolean> {
  const base = project.path.replace(/index\.html$/, "");
  const present = async (file: string) => {
    try {
      const res = await fetch(`${base}${file}`, { method: "HEAD", cache: "no-cache" });
      return res.ok && !(res.headers.get("content-type") ?? "").includes("text/html");
    } catch {
      return false;
    }
  };
  return (await Promise.all(project.media.map(present))).every(Boolean);
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
      hasMedia(p).then((ok) => {
        if (!cancelled) setStatus((s) => ({ ...s, [p.id]: ok ? "ok" : "missing" }));
      });
    }
    return () => {
      cancelled = true;
    };
  }, [projects]);

  return status;
}
