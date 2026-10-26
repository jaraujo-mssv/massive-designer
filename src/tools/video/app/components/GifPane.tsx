import type { ReactNode } from "react";
import { AlertTriangle, Check, Copy, Download, Terminal } from "lucide-react";
import { toast } from "sonner";
import type { VideoProject } from "../types";
import { HfPlayer } from "./HfPlayer";

const copy = async (text: string, what: string) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
  } catch {
    toast.error("Couldn't copy to clipboard");
  }
};

function Panel({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <figure className="min-w-0 flex flex-col gap-2">
      <figcaption className="flex items-baseline justify-between gap-3 px-1">
        <span className="text-xs font-semibold text-text-primary uppercase tracking-widest">{label}</span>
        {hint && <span className="text-[11px] text-text-dim font-mono truncate">{hint}</span>}
      </figcaption>
      <div className="rounded-xl overflow-hidden border border-border-subtle bg-black">{children}</div>
    </figure>
  );
}

/**
 * A looping LinkedIn GIF: the live HTML next to the rendered GIF (the GIF is the truth: 15 fps and a
 * 256-colour palette), its LinkedIn checks, first frame and alt text. Renders come from `npm run gif:render`.
 */
export function GifPane({ project }: { project: VideoProject }) {
  const { gif } = project;
  const command = `npm run gif:render ${project.id}`;
  const aspectRatio = `${project.width} / ${project.height}`;
  const portrait = project.height >= project.width;

  return (
    <div className="p-4 md:p-8 flex flex-col items-center gap-6">
      <div className="w-full grid gap-4 md:gap-6 md:grid-cols-2" style={{ maxWidth: portrait ? 880 : 1240 }}>
        <Panel label="Live HTML" hint="HyperFrames, looping">
          <HfPlayer src={project.path} width={project.width} height={project.height} muted loop autoplay />
        </Panel>
        <Panel
          label="GIF"
          hint={gif ? `${(gif.bytes / 1e6).toFixed(2)} MB · ${gif.frames} frames · ${gif.colors} colours` : "not rendered"}
        >
          {gif ? (
            <img src={gif.url} alt={project.alt ?? ""} className="block w-full" style={{ aspectRatio }} />
          ) : (
            <div className="flex flex-col items-center justify-center gap-3 p-6 text-center bg-surface" style={{ aspectRatio }}>
              <p className="text-sm text-text-mid">Not rendered yet.</p>
              <button
                onClick={() => copy(command, "Render command")}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border-subtle bg-surface-2 text-xs font-mono text-text-mid hover:border-brand hover:text-brand-light transition-colors"
              >
                <Terminal className="w-3.5 h-3.5 shrink-0" />
                {command}
                <Copy className="w-3.5 h-3.5 shrink-0" />
              </button>
            </div>
          )}
        </Panel>
      </div>

      {gif && (
        <div className="w-full grid gap-4 md:gap-6 md:grid-cols-[1fr_auto]" style={{ maxWidth: portrait ? 880 : 1240 }}>
          <section className="rounded-xl border border-border-subtle bg-surface p-4 md:p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xs font-semibold text-text-primary uppercase tracking-widest">LinkedIn checks</h2>
              <a
                href={gif.url}
                download={`${project.id}.gif`}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-brand text-xs font-medium text-white hover:opacity-90 transition-opacity"
              >
                <Download className="w-3.5 h-3.5" />
                Download GIF
              </a>
            </div>
            <ul className="mt-3 divide-y divide-border-subtle">
              {gif.checks.map((c) => (
                <li key={c.label} className="flex items-center gap-3 py-2 text-sm">
                  {c.ok ? (
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" aria-label="Passes" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-300" aria-label="Fails" />
                  )}
                  <span className="w-24 shrink-0 text-text-mid">{c.label}</span>
                  <span className="font-mono text-text-primary">{c.value}</span>
                  <span className="ml-auto text-[11px] text-text-dim font-mono text-right">{c.limit}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[11px] text-text-dim font-mono">
              Rendered {new Date(gif.renderedAt).toLocaleString()} · {gif.dither}
            </p>
          </section>
          <section className="rounded-xl border border-border-subtle bg-surface p-4 md:p-5 md:w-56">
            <h2 className="text-xs font-semibold text-text-primary uppercase tracking-widest">First frame</h2>
            <img
              src={gif.firstFrameUrl}
              alt=""
              className="mt-3 w-full max-w-56 rounded-md ring-1 ring-border-subtle"
              style={{ aspectRatio }}
            />
            <p className="mt-2 text-[11px] leading-relaxed text-text-dim">
              What LinkedIn shows before the GIF plays. It should read as a finished image.
            </p>
          </section>
        </div>
      )}

      <section className="w-full rounded-xl border border-border-subtle bg-surface p-4 md:p-5" style={{ maxWidth: portrait ? 880 : 1240 }}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-xs font-semibold text-text-primary uppercase tracking-widest">Alt text</h2>
          {project.alt && (
            <button
              onClick={() => copy(project.alt!, "Alt text")}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border-subtle bg-surface-2 text-[11px] font-mono text-text-mid hover:border-brand hover:text-brand-light transition-colors"
            >
              <Copy className="w-3 h-3" />
              Copy
            </button>
          )}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-text-mid">
          {project.alt ?? <span className="text-amber-300">No alt text yet. Add "alt" to the project's meta.json.</span>}
        </p>
      </section>
    </div>
  );
}
