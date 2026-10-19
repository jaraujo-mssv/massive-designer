import { useState } from "react";
import { EditForm, SelectField, TextField } from "@/shared/canvas/edit/fields";
import { LogoPicker } from "@/shared/canvas/edit/LogoPicker";
import { InitialsLogo } from "@/shared/canvas/logos/InitialsLogo";
import { useResolvedLogo } from "@/shared/canvas/logos/resolve";
import type { HiddenGroup } from "../utils/layout";
import type { Category, Company } from "../utils/parseSheet";
import {
  addCategory,
  addCompany,
  categoryNamed,
  deleteCategory,
  deleteCompany,
  findCompany,
  moveCompany,
  renameCategory,
  updateCompany,
} from "../utils/edit";

/** What a click on the map (or the sidebar's Add) opens. */
export type MapEditTarget =
  | { kind: "company"; companyId: string; back?: MapEditTarget }
  | { kind: "category"; categoryId: string }
  | { kind: "more"; categoryId: string }
  | { kind: "new-category" };

interface MapEditorProps {
  target: MapEditTarget;
  categories: Category[];
  /** Companies hidden to fit, behind each "+N more" pill. */
  hidden: HiddenGroup[];
  onCommit: (next: Category[]) => void;
  /** Swaps the popover's content (e.g. "+N more" → a company). */
  onNavigate: (target: MapEditTarget) => void;
  onClose: () => void;
}

const NEW_CATEGORY = "__new__";

/** The popover content for a click on the map. Each form applies on submit and closes. */
export function MapEditor(props: MapEditorProps) {
  const { target } = props;
  switch (target.kind) {
    case "company":
      return <CompanyForm {...props} target={target} />;
    case "category":
      return <CategoryForm {...props} target={target} />;
    case "more":
      return <HiddenList {...props} target={target} />;
    case "new-category":
      return <NewCategoryForm {...props} />;
  }
}

function CompanyForm({
  target,
  categories,
  onCommit,
  onNavigate,
  onClose,
}: MapEditorProps & { target: Extract<MapEditTarget, { kind: "company" }> }) {
  const found = findCompany(categories, target.companyId);
  const [name, setName] = useState(found?.company.name ?? "");
  const [logo, setLogo] = useState(found?.company.logoUrl ?? "");
  const [website, setWebsite] = useState(found?.company.website ?? "");
  const [categoryId, setCategoryId] = useState(found?.category.id ?? "");
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!found) return null;
  const { company, category } = found;

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return setError("A company needs a name.");
    let next = categories;
    const site = website.trim() || undefined;
    if (trimmed !== company.name || logo !== company.logoUrl || site !== company.website) {
      next = updateCompany(next, company.id, { name: trimmed, logoUrl: logo, website: site });
    }
    if (categoryId === NEW_CATEGORY) {
      const newName = newCategory.trim();
      if (!newName) return setError("Name the new category.");
      const existing = categoryNamed(next, newName);
      if (existing) {
        next = moveCompany(next, company.id, existing.id);
      } else {
        next = addCategory(deleteCompany(next, company.id), newName, { name: trimmed, logoUrl: logo, website: site }).categories;
      }
    } else if (categoryId !== category.id) {
      next = moveCompany(next, company.id, categoryId);
    }
    if (next !== categories) onCommit(next);
    onClose();
  };

  return (
    <EditForm
      title="Company"
      onSubmit={submit}
      onBack={target.back ? () => onNavigate(target.back!) : undefined}
      onDelete={() => {
        onCommit(deleteCompany(categories, company.id));
        onClose();
      }}
    >
      <TextField label="Name" value={name} onChange={(v) => (setName(v), setError(null))} error={error} />
      <LogoPicker name={name} logoUrl={logo} website={website} onLogoChange={setLogo} onWebsiteChange={setWebsite} />
      <SelectField
        label="Category"
        value={categoryId}
        onChange={setCategoryId}
        options={[
          ...categories.map((c) => ({ value: c.id, label: c.name })),
          { value: NEW_CATEGORY, label: "New category…" },
        ]}
      />
      {categoryId === NEW_CATEGORY && (
        <TextField label="New category" value={newCategory} onChange={setNewCategory} placeholder="e.g. Data infrastructure" />
      )}
    </EditForm>
  );
}

function CategoryForm({
  target,
  categories,
  onCommit,
  onClose,
}: MapEditorProps & { target: Extract<MapEditTarget, { kind: "category" }> }) {
  const category = categories.find((c) => c.id === target.categoryId);
  const [name, setName] = useState(category?.name ?? "");
  const [adding, setAdding] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [logo, setLogo] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);
  if (!category) return null;

  const submit = () => {
    const trimmed = name.trim();
    if (!trimmed) return setError("A category needs a name.");
    let next = categories;
    if (trimmed !== category.name) next = renameCategory(next, category.id, trimmed);
    if (adding && companyName.trim()) {
      next = addCompany(next, category.id, { name: companyName.trim(), logoUrl: logo, website: website.trim() || undefined });
    }
    if (next !== categories) onCommit(next);
    onClose();
  };

  const count = category.companies.length;
  return (
    <EditForm
      title="Category"
      onSubmit={submit}
      onDelete={() => {
        onCommit(deleteCategory(categories, category.id));
        onClose();
      }}
      confirmDelete={`Delete ${count} ${count === 1 ? "company" : "companies"} too?`}
    >
      <TextField label="Name" value={name} onChange={(v) => (setName(v), setError(null))} error={error} />
      {adding ? (
        <div className="space-y-3 p-2.5 rounded-lg bg-surface-2 border border-border-subtle">
          <TextField label="New company" value={companyName} onChange={setCompanyName} placeholder="Company name" />
          <LogoPicker
            name={companyName}
            logoUrl={logo}
            website={website}
            onLogoChange={setLogo}
            onWebsiteChange={setWebsite}
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="w-full px-3 py-1.5 text-xs text-text-dim border border-dashed border-border-subtle rounded-md hover:text-text-primary hover:border-brand transition-colors"
        >
          + Add company
        </button>
      )}
    </EditForm>
  );
}

function HiddenList({
  target,
  categories,
  hidden,
  onNavigate,
  onClose,
}: MapEditorProps & { target: Extract<MapEditTarget, { kind: "more" }> }) {
  const group = hidden.find((g) => g.categoryId === target.categoryId);
  const companies = (group?.ids ?? []).map((id) => findCompany(categories, id)?.company).filter((c): c is Company => c !== undefined);
  return (
    <EditForm title={`${companies.length} hidden to fit`} onSubmit={onClose}>
      <p className="text-xs text-text-dim">Hidden to keep pills readable. Click one to edit it.</p>
      <ul className="max-h-60 overflow-y-auto space-y-1">
        {companies.map((c) => (
          <li key={c.id}>
            <button
              type="button"
              onClick={() => onNavigate({ kind: "company", companyId: c.id, back: target })}
              className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-left rounded-md hover:bg-surface-2"
            >
              <SmallLogo name={c.name} logoUrl={c.logoUrl} website={c.website} />
              <span className="truncate">{c.name}</span>
            </button>
          </li>
        ))}
      </ul>
    </EditForm>
  );
}

/** A company's logo as the map shows it (resolved, or initials), small, for lists in the popover. */
function SmallLogo({ name, logoUrl, website }: { name: string; logoUrl: string; website?: string }) {
  const src = useResolvedLogo(logoUrl, website);
  return src ? (
    <img src={src} alt="" className="w-5 h-5 object-contain rounded-sm bg-white/90" />
  ) : (
    <InitialsLogo name={name} size={20} />
  );
}

function NewCategoryForm({ categories, onCommit, onClose }: MapEditorProps) {
  const [categoryName, setCategoryName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [logo, setLogo] = useState("");
  const [website, setWebsite] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    const cat = categoryName.trim();
    const company = companyName.trim();
    if (!cat && !company) return onClose();
    if (!cat) return setError("Name the category.");
    if (!company) return setError("A category needs at least one company.");
    const existing = categoryNamed(categories, cat);
    const first = { name: company, logoUrl: logo, website: website.trim() || undefined };
    onCommit(existing ? addCompany(categories, existing.id, first) : addCategory(categories, cat, first).categories);
    onClose();
  };

  return (
    <EditForm title="Add category" onSubmit={submit}>
      <TextField label="Category" value={categoryName} onChange={(v) => (setCategoryName(v), setError(null))} />
      <TextField label="First company" value={companyName} onChange={(v) => (setCompanyName(v), setError(null))} error={error} />
      <LogoPicker name={companyName} logoUrl={logo} website={website} onLogoChange={setLogo} onWebsiteChange={setWebsite} />
    </EditForm>
  );
}
