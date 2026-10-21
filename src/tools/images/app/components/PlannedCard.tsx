import { Copy } from "lucide-react";
import { toast } from "sonner";
import type { ImageCategory, ImageFormat, ImageProject } from "../types";

const FORMAT_LABEL: Record<ImageFormat, string> = {
  portrait: "Portrait 1080×1350",
  square: "Square 1080×1080",
  landscape: "Landscape 1920×1080",
  story: "Story 1080×1920",
  other: "Other",
};

interface PlannedCardProps {
  project: ImageProject;
  categories: ImageCategory[];
  projects: ImageProject[];
}

/** A Planned entry from planned.json: what to make, what it builds on, and the command that starts it. */
export function PlannedCard({ project, categories, projects }: PlannedCardProps) {
  const category = categories.find((c) => c.id === project.category);
  const template = project.template;
  const base =
    !template || template === "new"
      ? "A new layout, still to design."
      : template.startsWith("video:")
        ? `A still of the ${template.slice(6)} video (public/video-projects/${template.slice(6)}): hold its final frame.`
        : `Built on ${projects.find((p) => p.id === template)?.title ?? template} (${template}).`;
  const command = `npm run image:new -- --plan=${project.id}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      toast.success("Command copied");
    } catch {
      toast.error("Couldn't copy; select the command instead.");
    }
  };

  return (
    <div className="flex-1 min-w-0 overflow-y-auto p-4 md:p-8 flex items-start justify-center">
      <div className="w-full max-w-xl rounded-xl border border-dashed border-border-subtle bg-surface p-6 space-y-5">
        <div className="space-y-1">
          <p className="text-[11px] font-mono uppercase tracking-widest text-text-dim">Planned · {category?.label ?? "Uncategorized"}</p>
          <h2 className="text-xl font-semibold text-text-primary">{project.title}</h2>
        </div>
        {project.brief && <p className="text-sm text-text-primary leading-relaxed">{project.brief}</p>}
        <dl className="grid grid-cols-[7rem_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-text-dim">Layout</dt>
          <dd className="text-text-primary">{base}</dd>
          <dt className="text-text-dim">Formats</dt>
          <dd className="text-text-primary">{(project.formats ?? [project.format]).map((f) => FORMAT_LABEL[f]).join(", ")}</dd>
          {project.series && (
            <>
              <dt className="text-text-dim">Series</dt>
              <dd className="text-text-primary">{project.series}</dd>
            </>
          )}
          {project.tags.length > 0 && (
            <>
              <dt className="text-text-dim">Tags</dt>
              <dd className="text-text-primary">{project.tags.join(", ")}</dd>
            </>
          )}
        </dl>
        <div className="space-y-1.5">
          <p className="text-[11px] font-mono uppercase tracking-widest text-text-dim">Start it</p>
          <div className="flex items-center gap-2 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2">
            <code className="flex-1 min-w-0 truncate text-xs font-mono text-text-primary">{command}</code>
            <button onClick={copy} aria-label="Copy command" className="text-text-dim hover:text-brand-light">
              <Copy className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-text-dim">
            Scaffolds the project from the plan (its category, template and first format) and takes it off this list.
          </p>
        </div>
      </div>
    </div>
  );
}
