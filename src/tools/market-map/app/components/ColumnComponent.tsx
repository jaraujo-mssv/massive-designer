import { useDrag, useDrop } from "react-dnd";
import { Trash2 } from "lucide-react";
import { Column, Category, Settings } from "../App";
import { CategoryCard } from "./CategoryCard";
import { AddCategoryPanel } from "./AddCategoryPanel";

interface ColumnComponentProps {
  column: Column;
  columnIndex: number;
  columns: Column[];
  setColumns: (columns: Column[]) => void;
  settings: Settings;
  mode: "edit" | "preview";
  columnWidth: string;
  onMoveColumn: (fromIndex: number, toIndex: number) => void;
  onDeleteColumn: (columnId: string) => void;
}

export function ColumnComponent({
  column,
  columnIndex,
  columns,
  setColumns,
  settings,
  mode,
  columnWidth,
  onMoveColumn,
  onDeleteColumn,
}: ColumnComponentProps) {
  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "COLUMN",
      item: { columnIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      canDrag: mode === "edit",
    }),
    [columnIndex, mode]
  );

  const [{ isOver: isOverColumn }, dropColumn] = useDrop(
    () => ({
      accept: "COLUMN",
      drop: (item: { columnIndex: number }) => {
        if (item.columnIndex !== columnIndex) {
          onMoveColumn(item.columnIndex, columnIndex);
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
      }),
    }),
    [columnIndex, onMoveColumn]
  );

  // Make the column accept category drops (for empty columns)
  const [{ isOver: isOverCategory }, dropCategory] = useDrop(
    () => ({
      accept: "CATEGORY",
      drop: (item: { columnIndex: number; categoryIndex: number }, monitor) => {
        // Only handle if not dropped on a nested target
        if (monitor.didDrop()) {
          return;
        }
        // Move category to the end of this column
        handleMoveCategory(
          item.columnIndex,
          item.categoryIndex,
          columnIndex,
          column.categories.length
        );
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
      }),
    }),
    [columnIndex, column.categories.length]
  );

  const handleMoveCategory = (
    fromColumnIndex: number,
    fromCategoryIndex: number,
    toColumnIndex: number,
    toCategoryIndex: number
  ) => {
    const newColumns = [...columns];
    const [movedCategory] = newColumns[fromColumnIndex].categories.splice(
      fromCategoryIndex,
      1
    );
    newColumns[toColumnIndex].categories.splice(
      toCategoryIndex,
      0,
      movedCategory
    );
    setColumns(newColumns);
  };

  const handleAddCategory = (category: Category) => {
    const newColumns = [...columns];
    newColumns[columnIndex].categories.push(category);
    setColumns(newColumns);
  };

  const handleUpdateCategory = (
    categoryIndex: number,
    updates: Partial<Category>
  ) => {
    const newColumns = [...columns];
    newColumns[columnIndex].categories[categoryIndex] = {
      ...newColumns[columnIndex].categories[categoryIndex],
      ...updates,
    };
    setColumns(newColumns);
  };

  const handleDeleteCategory = (categoryIndex: number) => {
    const newColumns = [...columns];
    newColumns[columnIndex].categories.splice(categoryIndex, 1);
    setColumns(newColumns);
  };

  const combineRefs = (node: HTMLDivElement | null) => {
    if (mode === "edit") {
      drag(node);
      dropColumn(node);
      dropCategory(node);
    }
  };

  return (
    <div
      ref={combineRefs}
      className={`flex-shrink-0 ${isDragging ? "opacity-50" : ""} ${
        isOverColumn && mode === "edit" ? "ring-2 ring-orange-400" : ""
      } ${
        isOverCategory && mode === "edit" ? "ring-2 ring-orange-400" : ""
      }`}
      style={{
        width: columnWidth,
        minHeight: "200px",
      }}
    >
      <div
        className="flex flex-col h-full"
        style={{ 
          gap: `${settings.categoryGap}px`,
        }}
      >
        {/* Column Header (Edit mode only) */}
        {mode === "edit" && (
          <div className="flex items-center justify-between px-2 py-1 rounded-lg border" style={{ backgroundColor: '#1A1920', borderColor: '#2C2A30' }}>
            <span className="text-xs font-medium" style={{ color: 'rgba(250,244,236,0.5)' }}>
              Column {columnIndex + 1}
            </span>
            <button
              onClick={() => onDeleteColumn(column.id)}
              className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete column"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Categories */}
        {column.categories.map((category, categoryIndex) => (
          <CategoryCard
            key={category.id}
            category={category}
            columnIndex={columnIndex}
            categoryIndex={categoryIndex}
            columns={columns}
            setColumns={setColumns}
            settings={settings}
            mode={mode}
            onMoveCategory={handleMoveCategory}
            onUpdateCategory={(updates) =>
              handleUpdateCategory(categoryIndex, updates)
            }
            onDeleteCategory={() => handleDeleteCategory(categoryIndex)}
          />
        ))}

        {/* Add Category Panel (Edit mode only) */}
        {mode === "edit" && <AddCategoryPanel onAddCategory={handleAddCategory} />}

        {/* Empty state for drop target */}
        {mode === "edit" && column.categories.length === 0 && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-400 text-sm">
            Drag cards here
          </div>
        )}
      </div>
    </div>
  );
}