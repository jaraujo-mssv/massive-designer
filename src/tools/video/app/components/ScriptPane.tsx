import { useMemo, useState } from "react";
import type { VideoProject } from "../types";
import { parseScript } from "../utils/parseScript";

const projectDir = (p: VideoProject) => `public/video-projects/${p.id}`;

export function ScriptPane({ project }: { project: VideoProject }) {
  const [raw, setRaw] = useState(false);
  const parsed = useMemo(() => (project.script ? parseScript(project.script) : null), [project.script]);

  return (
    <div className="max-w-3xl mx-auto p-8 space-y-6">
      <div className="rounded-xl border border-border-subtle bg-surface p-5 space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg text-text-primary font-semibold">{parsed?.title ?? project.title}</h2>
          {project.script && (
            <button
              onClick={() => setRaw((r) => !r)}
              className="text-xs font-mono text-text-dim hover:text-brand-light transition-colors"
            >
              {raw ? "Formatted" : "Raw SCRIPT.md"}
            </button>
          )}
        </div>
        <dl className="grid grid-cols-[max-content_1fr] gap-x-4 gap-y-1.5 text-sm">
          {parsed?.header.map((h) => (
            <div key={h.key} className="contents">
              <dt className="text-text-dim">{h.key}</dt>
              <dd className="text-text-mid">{h.value}</dd>
            </div>
          ))}
          <dt className="text-text-dim">Project</dt>
          <dd className="text-text-mid font-mono text-xs pt-0.5">{projectDir(project)}</dd>
          {project.source && (
            <>
              <dt className="text-text-dim">Ported from</dt>
              <dd className="text-text-mid font-mono text-xs pt-0.5">{project.source}</dd>
            </>
          )}
        </dl>
        <p className="text-xs text-text-dim">
          Edit with Claude Code (<span className="font-mono">/massive-video</span>) or in HyperFrames Studio:{" "}
          <span className="font-mono text-text-mid">npm run video:preview {project.id}</span>
        </p>
      </div>

      {!project.script && (
        <div className="rounded-xl border border-dashed border-border-subtle p-6 text-sm text-text-dim">
          No narration. This video carries its message in on-screen copy only; see the Storyboard for its beats.
        </div>
      )}

      {project.script && raw && (
        <pre className="rounded-xl border border-border-subtle bg-surface p-5 text-xs text-text-mid font-mono whitespace-pre-wrap">
          {project.script}
        </pre>
      )}

      {parsed && !raw && (
        <ol className="space-y-3">
          {parsed.lines.map((line, i) => (
            <li key={i} className="rounded-xl border border-border-subtle bg-surface p-5 space-y-2">
              <div className="flex items-baseline justify-between gap-4">
                <h3 className="text-sm text-text-primary font-semibold">{line.heading}</h3>
                {line.time && <span className="text-xs font-mono text-text-dim shrink-0">{line.time}</span>}
              </div>
              {line.delivery && <p className="text-xs text-text-dim italic">{line.delivery}</p>}
              <p className="text-base text-text-primary leading-relaxed">{line.spoken}</p>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
