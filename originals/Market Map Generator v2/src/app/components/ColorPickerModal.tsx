import { X } from "lucide-react";
import { STROKE_COLORS } from "../utils/strokeColors";

interface ColorPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedColor?: number;
  onSelectColor: (colorNumber: number) => void;
  categoryName: string;
  onNameChange: (name: string) => void;
  categoryLogoUrl?: string;
  onLogoUrlChange?: (url: string) => void;
}

export function ColorPickerModal({
  isOpen,
  onClose,
  selectedColor,
  onSelectColor,
  categoryName,
  onNameChange,
  categoryLogoUrl,
  onLogoUrlChange,
}: ColorPickerModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white bg-opacity-50 backdrop-blur-md rounded-lg shadow-xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            Edit Category
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Name Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category Name
          </label>
          <input
            type="text"
            value={categoryName}
            onChange={(e) => onNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
            placeholder="Enter category name"
            autoFocus
          />
        </div>

        {/* Logo URL Input */}
        {onLogoUrlChange && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category Logo URL
            </label>
            <input
              type="text"
              value={categoryLogoUrl || ""}
              onChange={(e) => onLogoUrlChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
              placeholder="Enter logo URL (optional)"
            />
          </div>
        )}

        {/* Color Picker */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Card Border Color
          </label>
          <div className="grid grid-cols-4 gap-3">
            {Object.entries(STROKE_COLORS).map(([number, color]) => {
              const colorNum = parseInt(number);
              const isSelected = selectedColor === colorNum;
              return (
                <button
                  key={number}
                  onClick={() => onSelectColor(colorNum)}
                  className={`h-12 rounded-lg border-4 transition-all ${
                    isSelected
                      ? "border-gray-800 scale-105 shadow-lg"
                      : "border-transparent hover:border-gray-300 hover:scale-105"
                  }`}
                  style={{ backgroundColor: color }}
                  title={`Color ${number}`}
                />
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 text-white bg-orange-500 hover:bg-orange-600 rounded-lg transition-colors font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}