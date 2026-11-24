import { useEffect, useState } from "react";
import { Download } from "lucide-react";

const megabytes = (bytes: number) => {
  const mb = bytes / 1048576;
  return `${mb < 10 ? mb.toFixed(1) : Math.round(mb)} MB`;
};

/**
 * Downloads the rendered MP4 (output/video/<name>.mp4, served by the dev server's video-renders plugin in
 * vite.config.ts). Hidden until there's a render; checks again when the window regains focus, so a render
 * finished in the terminal shows up without a reload.
 */
export function DownloadRender({ name }: { name: string }) {
  const url = `/api/video/render/${name}.mp4`;
  const [size, setSize] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch(url, { method: "HEAD", cache: "no-store" });
        // Without the plugin (a build), the SPA fallback answers with HTML: that's not a render.
        const isVideo = res.ok && (res.headers.get("content-type") ?? "").includes("video/mp4");
        if (!cancelled) setSize(isVideo ? Number(res.headers.get("content-length") ?? 0) : null);
      } catch {
        if (!cancelled) setSize(null);
      }
    };
    check();
    window.addEventListener("focus", check);
    return () => {
      cancelled = true;
      window.removeEventListener("focus", check);
    };
  }, [url]);

  if (size === null) return null;

  return (
    <a
      href={`${url}?download=1`}
      download={`${name}.mp4`}
      title={`Download output/video/${name}.mp4`}
      className="shrink-0 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-brand/30 bg-brand/10 text-xs font-mono text-brand-light hover:bg-brand/20 transition-colors"
    >
      <Download className="w-3.5 h-3.5 shrink-0" />
      <span>Download MP4</span>
      {size > 0 && <span className="hidden lg:inline text-text-dim">{megabytes(size)}</span>}
    </a>
  );
}
