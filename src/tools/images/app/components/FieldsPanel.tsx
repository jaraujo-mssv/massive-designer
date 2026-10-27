import { useEffect, useRef, useState } from "react";
import { ArrowCounterClockwise, UploadSimple } from "@phosphor-icons/react";
import { SidebarWarning, sidebarHeadingClass, sidebarInputClass } from "@/shared/components/SidebarLayout";
import { proxyUrl } from "@/shared/utils/imageDataUrl";
import { PHOTO_ERROR, unknownMessage } from "../../params";
import { checkPhoto, fileIn, hasImageFile } from "../photo";
import type { FieldValues, ImageField, ImageProject } from "../types";

interface FieldsPanelProps {
  project: ImageProject;
  values: FieldValues;
  /** Uploaded photos' file names, by field. */
  names: Record<string, string>;
  /** What a link or a photo got wrong, by field. */
  errors: Record<string, string>;
  /** Params in the link that the image doesn't have. */
  unknown: string[];
  edited: boolean;
  onChange: (id: string, value: string | boolean, name?: string) => void;
  /** An uploaded, dropped or pasted file for an image field. */
  onFile: (id: string, file: File) => void;
  onError: (id: string, message: string) => void;
  onReset: () => void;
  /** Phones: drawn inside the drawer, full width, without its own column frame. */
  inDrawer?: boolean;
}

const isLink = (v: string) => /^https?:\/\//i.test(v);

/** Field image paths in meta.json are relative to the project page; photo links load through the image proxy. */
const resolveSrc = (project: ImageProject, src: string) =>
  isLink(src)
    ? proxyUrl(src)
    : src.startsWith("data:") || src.startsWith("/")
      ? src
      : new URL(src, new URL(project.path ?? "/", window.location.origin)).href;

/** Where the photo came from: the file's name, the link's site, the ready-made photo's name, or the template. */
function sourceOf(field: ImageField, value: string, name: string | undefined) {
  if (value.startsWith("data:")) return name ?? "Uploaded photo";
  if (isLink(value)) {
    try {
      return new URL(value).hostname;
    } catch {
      return value;
    }
  }
  return field.options?.find((o) => o.value === value)?.label ?? (value === field.default ? "Template photo" : value.split("/").pop());
}

/**
 * A photo, three ways: pick one of the field's ready-made photos (thumbnails, when it has some), upload one
 * yourself (the button, a drop on the field, or a paste anywhere on the page, which App handles) or paste a link
 * to it. One photo at a time; the last one in wins.
 */
function ImageInput({
  project,
  field,
  value,
  name,
  onChange,
  onFile,
  onError,
}: {
  project: ImageProject;
  field: ImageField;
  value: string;
  name: string | undefined;
  onChange: (v: string) => void;
  onFile: (file: File) => void;
  onError: (message: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(isLink(value) ? value : "");
  const [checking, setChecking] = useState(false);
  const [dragging, setDragging] = useState(false);
  const pending = useRef("");

  // The link box shows the photo's link, and nothing once a file or the template photo takes its place.
  useEffect(() => setDraft(isLink(value) ? value : ""), [value]);

  const applyLink = async (text: string) => {
    const url = text.trim();
    if (url === (isLink(value) ? value : "")) return;
    if (!url) {
      onChange(String(field.default));
      return;
    }
    if (!isLink(url)) {
      onError(PHOTO_ERROR);
      return;
    }
    if (url === pending.current) return;
    pending.current = url;
    setChecking(true);
    const ok = await checkPhoto(url);
    pending.current = "";
    setChecking(false);
    if (ok) onChange(url);
    else {
      onError(PHOTO_ERROR);
      if (isLink(value)) onChange(String(field.default));
    }
  };

  return (
    <div
      className={`space-y-2 rounded-lg transition-shadow ${dragging ? "ring-2 ring-brand ring-offset-4 ring-offset-surface" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragging(false);
        const file = fileIn(e.dataTransfer);
        if (file) onFile(file);
      }}
    >
      {!!field.options?.length && (
        <div className="grid grid-cols-4 gap-1.5">
          {field.options.map((o) => {
            const picked = value === o.value;
            return (
              <button
                key={o.value}
                onClick={() => onChange(o.value)}
                title={o.label}
                aria-label={`${field.label}: ${o.label}`}
                aria-pressed={picked}
                className={`aspect-square rounded-md overflow-hidden border bg-surface-2 transition-colors ${
                  picked ? "border-brand ring-1 ring-brand" : "border-border-subtle hover:border-brand/60"
                }`}
              >
                <img src={resolveSrc(project, o.value)} alt="" loading="lazy" className="w-full h-full object-cover" />
              </button>
            );
          })}
        </div>
      )}
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
            title="Use the template's photo"
            aria-label={`Reset ${field.label}`}
            className="p-2 rounded-lg text-text-dim hover:text-text-primary hover:bg-surface-2"
          >
            <ArrowCounterClockwise size={14} />
          </button>
        )}
      </div>
      <p className="text-[11px] text-text-dim truncate" title={sourceOf(field, value, name)}>
        {checking ? "Loading photo…" : sourceOf(field, value, name)}
      </p>
      <input
        type="url"
        inputMode="url"
        value={draft}
        placeholder="Or paste a photo link"
        aria-label={`${field.label} link`}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => applyLink(draft)}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur();
        }}
        onPaste={(e) => {
          // An image on the clipboard is a photo (App takes it); text is a link to use right away.
          if (hasImageFile(e.clipboardData)) return;
          const text = e.clipboardData.getData("text");
          if (!text) return;
          e.preventDefault();
          setDraft(text.trim());
          applyLink(text);
        }}
        className={sidebarInputClass}
      />
      {/* A real file input, labelled by the field's label, so browser tools can put a file in it. */}
      <input
        ref={input}
        id={`field-${field.id}`}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (file) onFile(file);
        }}
      />
    </div>
  );
}

export function FieldsPanel({
  project,
  values,
  names,
  errors,
  unknown,
  edited,
  onChange,
  onFile,
  onError,
  onReset,
  inDrawer = false,
}: FieldsPanelProps) {
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
        {unknown.length > 0 && <SidebarWarning>{unknownMessage(unknown, project.fields)}</SidebarWarning>}
        {project.fields.length === 0 && <p className="text-sm text-text-dim">This image has no editable fields.</p>}
        {project.fields.map((field) => {
          const value = values[field.id] ?? field.default;
          const notes = (
            <>
              {errors[field.id] && <p className="text-[11px] text-red-400 leading-snug">{errors[field.id]}</p>}
              {field.hint && <p className="text-[11px] text-text-dim leading-snug">{field.hint}</p>}
            </>
          );
          if (field.type === "toggle") {
            return (
              <div key={field.id} className="space-y-1">
                <label className="flex items-center justify-between gap-3 cursor-pointer">
                  <span className="text-sm text-text-primary">{field.label}</span>
                  <input
                    type="checkbox"
                    checked={value !== false}
                    onChange={(e) => onChange(field.id, e.target.checked)}
                    className="w-4 h-4 accent-[var(--red)]"
                  />
                </label>
                {notes}
              </div>
            );
          }
          return (
            <div key={field.id} className="space-y-1.5">
              <label htmlFor={`field-${field.id}`} className="block text-xs text-text-dim">
                {field.label}
              </label>
              {field.type === "image" ? (
                <ImageInput
                  project={project}
                  field={field}
                  value={String(value)}
                  name={names[field.id]}
                  onChange={(v) => onChange(field.id, v)}
                  onFile={(file) => onFile(field.id, file)}
                  onError={(message) => onError(field.id, message)}
                />
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
              {notes}
            </div>
          );
        })}
        {project.description && <p className="pt-2 text-xs text-text-dim leading-relaxed">{project.description}</p>}
      </div>
    </div>
  );
}
