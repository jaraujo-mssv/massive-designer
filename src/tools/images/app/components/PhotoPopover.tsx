import { useRef } from "react";
import { ArrowCounterClockwise, UploadSimple } from "@phosphor-icons/react";
import { EditPopover } from "@/shared/canvas/edit/EditPopover";
import { EditForm } from "@/shared/canvas/edit/fields";
import { resolveSrc, sourceOf } from "../photo";
import type { ImageField, ImageProject } from "../types";

const tileClass = "aspect-square rounded-md overflow-hidden border bg-surface-2 transition-colors";
const pickedClass = "border-brand ring-1 ring-brand";
const idleClass = "border-border-subtle hover:border-brand/60";
const actionClass = `${tileClass} ${idleClass} flex flex-col items-center justify-center gap-1 text-[11px] text-text-dim hover:text-text-primary`;

/**
 * A photo clicked on the canvas: the photo in use, the field's ready-made photos, Upload and Reset, as one grid of
 * tiles. A pick shows on the image at once; Done (Enter, clicking away) keeps it, Esc puts back the photo it opened with.
 */
export function PhotoPopover({
  anchor,
  project,
  field,
  value,
  name,
  error,
  onChange,
  onFile,
  onClose,
}: {
  anchor: HTMLElement | null;
  project: ImageProject;
  field: ImageField;
  value: string;
  /** The upload's file name, when the photo is one. */
  name: string | undefined;
  error: string | undefined;
  onChange: (value: string, name?: string) => void;
  onFile: (file: File) => void;
  onClose: () => void;
}) {
  const opened = useRef({ value, name });
  const input = useRef<HTMLInputElement>(null);
  const isOption = field.options?.some((o) => o.value === value);

  return (
    <EditPopover
      anchor={anchor}
      onCancel={() => {
        if (value !== opened.current.value) onChange(opened.current.value, opened.current.name);
        onClose();
      }}
    >
      <EditForm title={field.label} submitLabel="Done" onSubmit={onClose}>
        <div className="grid grid-cols-4 gap-1.5">
          {!isOption && (
            <div className={`${tileClass} ${pickedClass}`} title={sourceOf(field, value, name)}>
              <img src={resolveSrc(project, value)} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          {field.options?.map((o) => {
            const picked = value === o.value;
            return (
              <button
                key={o.value}
                type="button"
                onClick={() => onChange(o.value)}
                title={o.label}
                aria-label={`${field.label}: ${o.label}`}
                aria-pressed={picked}
                className={`${tileClass} ${picked ? pickedClass : idleClass}`}
              >
                <img src={resolveSrc(project, o.value)} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            );
          })}
          <button type="button" onClick={() => input.current?.click()} title="Use a photo of your own" className={actionClass}>
            <UploadSimple size={16} weight="bold" />
            Upload
          </button>
          {value !== field.default && (
            <button
              type="button"
              onClick={() => onChange(String(field.default))}
              title="Use the template's photo"
              aria-label={`Reset ${field.label}`}
              className={actionClass}
            >
              <ArrowCounterClockwise size={16} />
              Reset
            </button>
          )}
        </div>
        {error && <p className="text-[11px] text-red-400 leading-snug">{error}</p>}
        {field.hint && <p className="text-[11px] text-text-dim leading-snug">{field.hint}</p>}
        <input
          ref={input}
          type="file"
          accept="image/*"
          aria-label={`Upload ${field.label.toLowerCase()}`}
          className="sr-only"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) onFile(file);
          }}
        />
      </EditForm>
    </EditPopover>
  );
}
