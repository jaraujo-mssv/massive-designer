import { useDrag, useDrop } from "react-dnd";
import { Trash2, Edit2, RotateCcw } from "lucide-react";
import { Category, Company, Settings, Column } from "../App";
import { CompanyItem } from "./CompanyItem";
import { AddCompanyPanel } from "./AddCompanyPanel";
import { useState } from "react";
import { Slider } from "@/shared/components/ui/slider";
import { Label } from "@/shared/components/ui/label";

interface CategoryCardProps {
  category: Category;
  columnIndex: number;
  categoryIndex: number;
  columns: Column[];
  setColumns: (columns: Column[]) => void;
  settings: Settings;
  mode: "edit" | "preview";
  onMoveCategory: (
    fromColumnIndex: number,
    fromCategoryIndex: number,
    toColumnIndex: number,
    toCategoryIndex: number
  ) => void;
  onUpdateCategory: (updates: Partial<Category>) => void;
  onDeleteCategory: () => void;
  autoCardHeight?: number;
}

export function CategoryCard({
  category,
  columnIndex,
  categoryIndex,
  columns,
  setColumns,
  settings,
  mode,
  onMoveCategory,
  onUpdateCategory,
  onDeleteCategory,
  autoCardHeight,
}: CategoryCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(category.name);

  const [{ isDragging }, drag] = useDrag(
    () => ({
      type: "CATEGORY",
      item: { columnIndex, categoryIndex },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
      canDrag: mode === "edit",
    }),
    [columnIndex, categoryIndex, mode]
  );

  const [{ isOver }, drop] = useDrop(
    () => ({
      accept: "CATEGORY",
      drop: (item: { columnIndex: number; categoryIndex: number }) => {
        if (
          item.columnIndex !== columnIndex ||
          item.categoryIndex !== categoryIndex
        ) {
          onMoveCategory(
            item.columnIndex,
            item.categoryIndex,
            columnIndex,
            categoryIndex
          );
        }
      },
      collect: (monitor) => ({
        isOver: monitor.isOver(),
      }),
    }),
    [columnIndex, categoryIndex, onMoveCategory]
  );

  const combineRefs = (node: HTMLDivElement | null) => {
    if (mode === "edit") {
      drag(node);
      drop(node);
    }
  };

  const handleMoveCompany = (
    fromColumnIndex: number,
    fromCategoryIndex: number,
    fromCompanyIndex: number,
    toColumnIndex: number,
    toCategoryIndex: number,
    toCompanyIndex: number
  ) => {
    const newColumns = [...columns];
    const [movedCompany] = newColumns[fromColumnIndex].categories[
      fromCategoryIndex
    ].companies.splice(fromCompanyIndex, 1);
    newColumns[toColumnIndex].categories[toCategoryIndex].companies.splice(
      toCompanyIndex,
      0,
      movedCompany
    );
    setColumns(newColumns);
  };

  const handleAddCompany = (company: Company) => {
    const newCompanies = [...category.companies, company];
    onUpdateCategory({ companies: newCompanies });
  };

  const handleUpdateCompany = (companyIndex: number, updates: Partial<Company>) => {
    const newCompanies = [...category.companies];
    newCompanies[companyIndex] = { ...newCompanies[companyIndex], ...updates };
    onUpdateCategory({ companies: newCompanies });
  };

  const handleDeleteCompany = (companyIndex: number) => {
    const newCompanies = category.companies.filter((_, i) => i !== companyIndex);
    onUpdateCategory({ companies: newCompanies });
  };

  const handleNameEdit = () => {
    if (isEditingName && editedName.trim() !== category.name) {
      onUpdateCategory({ name: editedName.trim() });
    }
    setIsEditingName(!isEditingName);
  };

  const currentCompanyGap = category.customCompanyGap ?? settings.companyGap;

  return (
    <div
      ref={combineRefs}
      className={`shadow-sm overflow-hidden ${
        isDragging ? "opacity-50" : ""
      } ${isOver && mode === "edit" ? "ring-2 ring-orange-400" : ""}`}
      style={{
        backgroundColor: '#FFFFFF',
        border: `${settings.cardStrokeSize}px solid #FCD9AE`,
        borderRadius: '8px',
        ...(autoCardHeight && {
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          minHeight: 0
        })
      }}
    >
      {/* Header */}
      <div className="relative px-4 py-3">
        {mode === "edit" && (
          <>
            <button
              onClick={onDeleteCategory}
              className="absolute top-2 right-2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
              title="Delete category"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={handleNameEdit}
              className="absolute top-2 right-10 p-1 text-orange-500 hover:bg-orange-50 rounded transition-colors"
              title="Edit category name"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </>
        )}
        {isEditingName ? (
          <input
            type="text"
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            onBlur={handleNameEdit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNameEdit();
              if (e.key === "Escape") {
                setEditedName(category.name);
                setIsEditingName(false);
              }
            }}
            className="bg-white border border-orange-500 rounded px-2 py-1 outline-none w-full"
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#283A4C'
            }}
            autoFocus
          />
        ) : (
          <h3 
            className={mode === "preview" ? "" : "pr-16"}
            style={{
              fontFamily: 'Inter, sans-serif',
              fontWeight: 700,
              fontStyle: 'italic',
              color: '#283A4C',
              lineHeight: '120%'
            }}
          >
            {category.name}
          </h3>
        )}
      </div>

      {/* Company Gap Control - Edit Mode Only */}
      {mode === "edit" && (
        <div className="px-4 pb-3 pt-0 flex items-center gap-2 border-t border-gray-100">
          <Label className="text-xs text-gray-600 whitespace-nowrap">Co Gap</Label>
          <Slider
            value={[currentCompanyGap]}
            onValueChange={([value]) => onUpdateCategory({ customCompanyGap: value })}
            min={0}
            max={48}
            step={2}
            className="flex-1"
          />
          <span className="text-xs text-gray-500 w-6">{currentCompanyGap}</span>
          {category.customCompanyGap !== undefined && (
            <button
              onClick={() => onUpdateCategory({ customCompanyGap: undefined })}
              className="p-1 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded transition-colors"
              title="Reset to global gap"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* Companies */}
      <div
        className="p-3"
        style={{
          display: "flex",
          flexDirection: "column",
          gap: `${currentCompanyGap}px`,
          ...(autoCardHeight && {
            flex: 1,
            minHeight: 0
          })
        }}
      >
        {category.companies.map((company, companyIndex) => (
          <CompanyItem
            key={company.id}
            company={company}
            columnIndex={columnIndex}
            categoryIndex={categoryIndex}
            companyIndex={companyIndex}
            mode={mode}
            settings={settings}
            onMoveCompany={handleMoveCompany}
            onUpdateCompany={(updates) => handleUpdateCompany(companyIndex, updates)}
            onDeleteCompany={() => handleDeleteCompany(companyIndex)}
          />
        ))}
        {mode === "edit" && <AddCompanyPanel onAddCompany={handleAddCompany} settings={settings} />}
      </div>
    </div>
  );
}