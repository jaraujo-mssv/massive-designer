import { useRef } from "react";
import { ArrowCounterClockwise, UploadSimple } from "@phosphor-icons/react";
import { toast } from "sonner";
import { sidebarHeadingClass, sidebarInputClass } from "@/shared/components/SidebarLayout";
import { MAX_UPLOAD_EDGE } from "../constants";
import type { FieldValues, ImageField, ImageProject } from "../types";

interface FieldsPanelProps {
  project: ImageProject;
  values: FieldValues;
  edited: boolean;
  onChange: (id: string, value: string | boolean) => void;
  onReset: () => void;
  /** Phones: drawn inside the drawer, full width, without its own column frame. */
  inDrawer?: boolean;
}

/** Read an uploaded image and scale it down to a JPEG data URL, small enough to keep in localStorage. */
async function readImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const k = Math.min(1, MAX_UPLOAD_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * k);
  canvas.height = Math.round(bitmap.height * k);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL("image/jpeg", 0.9);
}

/** Field image paths in meta.json are relative to the project page. */
const resolveSrc = (project: ImageProject, src: string) =>
  src.startsWith("data:") || src.startsWith("/") || /^https?:/.test(src) ? src : new URL(src, new URL(project.path, window.location.origin)).href;

function ImageInput({ project, field, value, onChange }: { project: ImageProject; field: ImageField; value: string; onChange: (v: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-3">
      <img src={resolveSrc(project, value)} alt="" className="w-12 h-12 rounded-md object-cover bg-surface-2 border border-border-subtle shrink-0" />
      <button
        onClick={() => input.current?.click()}
        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border-subtle bg-surface-2 text-sm text-text-primary hover:border-brand hover:text-brand-light transition-colors"
      >
        <UploadSimple size={14} weight="bold" />
        Upload
      </button>
      {value !== field.default && (
        <button
          onClick={() => onChange(String(field.default))}
          title="Use the original"
          aria-label={`Reset ${field.label}`}
          className="p-2 rounded-lg text-text-dim hover:text-text-primary hover:bg-surface-2"
        >
          <ArrowCounterClockwise size={14} />
        </button>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            onChange(await readImage(file));
          } catch {
            toast.error("Couldn't read that image.");
          }
        }}
      />
    </div>
  );
}

export function FieldsPanel({ project, values, edited, onChange, onReset, inDrawer = false }: FieldsPanelProps) {
  return (
    <div className={inDrawer ? "flex flex-col" : "w-80 shrink-0 flex flex-col bg-surface border-l border-border-subtle"}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
        <span className={`${sidebarHeadingClass} font-mono`}>Fields</span>
        {edited && (
          <button onClick={onReset} className="flex items-center gap-1.5 text-[11px] font-mono text-text-dim hover:text-brand-light">
            <ArrowCounterClockwise size={12} />
            Reset
          </button>
        )}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {project.fields.length === 0 && <p className="text-sm text-text-dim">This image has no editable fields.</p>}
        {project.fields.map((field) => {
          const value = values[field.id] ?? field.default;
          if (field.type === "toggle") {
            return (
              <label key={field.id} className="flex items-center justify-between gap-3 cursor-pointer">
                <span className="text-sm text-text-primary">{field.label}</span>
                <input
                  type="checkbox"
                  checked={value !== false}
                  onChange={(e) => onChange(field.id, e.target.checked)}
                  className="w-4 h-4 accent-[var(--red)]"
                />
              </label>
            );
          }
          return (
            <div key={field.id} className="space-y-1.5">
              <label htmlFor={`field-${field.id}`} className="block text-xs text-text-dim">
                {field.label}
              </label>
              {field.type === "image" ? (
                <ImageInput project={project} field={field} value={String(value)} onChange={(v) => onChange(field.id, v)} />
              ) : field.type === "select" ? (
                <select
                  id={`field-${field.id}`}
                  value={String(value)}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className={sidebarInputClass}
                >
                  {field.options?.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  id={`field-${field.id}`}
                  value={String(value)}
                  onChange={(e) => onChange(field.id, e.target.value)}
                  className={sidebarInputClass}
                />
              )}
            </div>
          );
        })}
        {project.description && <p className="pt-2 text-xs text-text-dim leading-relaxed">{project.description}</p>}
      </div>
    </div>
  );
}
