import { Eye, Edit3 } from "lucide-react";

interface ModeToggleProps {
  mode: "edit" | "preview";
  setMode: (mode: "edit" | "preview") => void;
}

export function ModeToggle({ mode, setMode }: ModeToggleProps) {
  return (
    <div className="flex items-center bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setMode("edit")}
        className={`flex items-center gap-2 px-4 py-3 transition-colors ${
          mode === "edit"
            ? "bg-orange-500 text-white"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        <Edit3 className="w-4 h-4" />
        <span className="font-medium">Edit</span>
      </button>
      <button
        onClick={() => setMode("preview")}
        className={`flex items-center gap-2 px-4 py-3 transition-colors ${
          mode === "preview"
            ? "bg-orange-500 text-white"
            : "bg-white text-gray-700 hover:bg-gray-50"
        }`}
      >
        <Eye className="w-4 h-4" />
        <span className="font-medium">Preview</span>
      </button>
    </div>
  );
}