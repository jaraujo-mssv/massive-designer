import { Eye, Edit3 } from "lucide-react";

interface ModeToggleProps {
  mode: "edit" | "preview";
  setMode: (mode: "edit" | "preview") => void;
}

export function ModeToggle({ mode, setMode }: ModeToggleProps) {
  return (
    <div className="flex items-center bg-surface-2 rounded-lg border border-border-subtle overflow-hidden">
      <button
        onClick={() => setMode("edit")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
          mode === "edit"
            ? "bg-brand text-white"
            : "text-text-dim hover:text-text-primary"
        }`}
      >
        <Edit3 className="w-3.5 h-3.5" />
        Edit
      </button>
      <button
        onClick={() => setMode("preview")}
        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors ${
          mode === "preview"
            ? "bg-brand text-white"
            : "text-text-dim hover:text-text-primary"
        }`}
      >
        <Eye className="w-3.5 h-3.5" />
        Preview
      </button>
    </div>
  );
}
