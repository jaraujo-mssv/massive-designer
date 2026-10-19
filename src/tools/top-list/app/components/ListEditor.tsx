import { useState } from "react";
import { EditForm, TextField } from "@/shared/canvas/edit/fields";
import { LogoPicker } from "@/shared/canvas/edit/LogoPicker";
import { addItem, deleteItem, draftFields, ItemDraft, moveItem, updateItem } from "../utils/edit";
import type { Layout, ListItem } from "../utils/parseSheet";

/** What a click on a tile (or the sidebar's Add) opens. */
export type ListEditTarget = { kind: "item"; id: string } | { kind: "new" };

interface ListEditorProps {
  target: ListEditTarget;
  items: ListItem[];
  layout: Layout;
  onCommit: (next: ListItem[]) => void;
  onClose: () => void;
}

/**
 * The popover content for a tile: name, description, logo, value, and in grid
 * the rank. Applies on submit and closes; an unreadable Bento value stays open
 * with an error.
 */
export function ListEditor({ target, items, layout, onCommit, onClose }: ListEditorProps) {
  const item = target.kind === "item" ? items.find((i) => i.id === target.id) : undefined;
  const [draft, setDraft] = useState<ItemDraft>({
    name: item?.name ?? "",
    description: item?.description ?? "",
    logoUrl: item?.logoUrl ?? "",
    website: item?.website ?? "",
    valueText: item?.valueText ?? item?.valueLabel ?? "",
  });
  const [rank, setRank] = useState(String(item?.rank ?? items.length + 1));
  const [error, setError] = useState<{ field: "name" | "value"; message: string } | null>(null);
  if (target.kind === "item" && !item) return null;

  const set = (patch: Partial<ItemDraft>) => {
    setDraft((d) => ({ ...d, ...patch }));
    setError(null);
  };

  const submit = () => {
    const isNew = !item;
    // An untouched Add closes quietly instead of complaining about the empty name.
    if (isNew && !draft.name.trim() && !draft.valueText.trim()) return onClose();
    const fields = draftFields(draft, layout);
    if (typeof fields === "string") {
      return setError({ field: draft.name.trim() ? "value" : "name", message: fields });
    }
    const wantedRank = parseInt(rank, 10);
    let next: ListItem[];
    if (isNew) {
      next = addItem(items, fields, layout, Number.isFinite(wantedRank) ? wantedRank : undefined);
    } else {
      const unchanged =
        draft.name.trim() === item.name &&
        (draft.description.trim() || undefined) === item.description &&
        draft.logoUrl === item.logoUrl &&
        (draft.website.trim() || undefined) === item.website &&
        draft.valueText.trim() === (item.valueText ?? item.valueLabel ?? "");
      next = unchanged ? items : updateItem(items, item.id, fields, layout);
      if (layout === "grid" && Number.isFinite(wantedRank) && wantedRank !== item.rank) {
        next = moveItem(next, item.id, wantedRank, layout);
      }
    }
    if (next !== items) onCommit(next);
    onClose();
  };

  return (
    <EditForm
      title={item ? `#${item.rank}` : "Add company"}
      onSubmit={submit}
      onDelete={
        item &&
        (() => {
          onCommit(deleteItem(items, item.id, layout));
          onClose();
        })
      }
    >
      <TextField
        label="Name"
        value={draft.name}
        onChange={(name) => set({ name })}
        error={error?.field === "name" ? error.message : null}
      />
      <TextField
        label="Description"
        value={draft.description}
        onChange={(description) => set({ description })}
        placeholder="Optional, shown under the name"
      />
      <LogoPicker
        name={draft.name}
        logoUrl={draft.logoUrl}
        website={draft.website}
        onLogoChange={(logoUrl) => set({ logoUrl })}
        onWebsiteChange={(website) => set({ website })}
      />
      <div className="flex gap-2">
        <div className="flex-1">
          <TextField
            label={layout === "bento" ? "Value (sizes the tile)" : "Value (optional)"}
            value={draft.valueText}
            onChange={(valueText) => set({ valueText })}
            placeholder={layout === "bento" ? "$1.2B" : "Any text"}
            error={error?.field === "value" ? error.message : null}
          />
        </div>
        {layout === "grid" && (
          <div className="w-20">
            <TextField label="Rank" type="number" value={rank} onChange={setRank} />
          </div>
        )}
      </div>
    </EditForm>
  );
}
