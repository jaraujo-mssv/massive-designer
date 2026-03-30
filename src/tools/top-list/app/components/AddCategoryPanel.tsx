import { Plus } from "lucide-react";
import { useState } from "react";
import { Category } from "../App";

interface AddCategoryPanelProps {
  onAddCategory: (category: Category) => void;
}

export function AddCategoryPanel({ onAddCategory }: AddCategoryPanelProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [categoryName, setCategoryName] = useState("");

  const handleAdd = () => {
    if (categoryName.trim()) {
      const newCategory: Category = {
        id: `cat-${Date.now()}`,
        name: categoryName.trim(),
        companies: [],
      };
      onAddCategory(newCategory);
      setCategoryName("");
      setIsAdding(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleAdd();
    } else if (e.key === "Escape") {
      setCategoryName("");
      setIsAdding(false);
    }
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex items-center justify-center gap-2 p-4 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-400 hover:bg-orange-50 transition-colors text-gray-500 hover:text-orange-600"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Add Category</span>
      </button>
    );
  }

  return (
    <div className="p-4 bg-white border-2 border-orange-400 rounded-lg shadow-sm">
      <input
        type="text"
        value={categoryName}
        onChange={(e) => setCategoryName(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={handleAdd}
        placeholder="Category name..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
        autoFocus
      />
    </div>
  );
}