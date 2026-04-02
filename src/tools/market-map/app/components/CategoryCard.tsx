import { useDrag, useDrop } from "react-dnd";
import { Trash2, Edit2, RotateCcw } from "lucide-react";
import { Category, Company, Settings, Column } from "../App";
import { CompanyItem } from "./CompanyItem";
import { AddCompanyPanel } from "./AddCompanyPanel";
import { useState } from "react";
import { useImageToDataUrl } from "../hooks/useImageToDataUrl";
import { Slider } from "@/shared/components/ui/slider";
import { Label } from "@/shared/components/ui/label";
import { ColorPickerModal } from "./ColorPickerModal";
import { getStrokeColor } from "../utils/strokeColors";

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
}: CategoryCardProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(category.name);
  const [editedLogoUrl, setEditedLogoUrl] = useState(category.logoUrl || "");
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const categoryLogoDataUrl = useImageToDataUrl(category.logoUrl);

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
      drag(drop(node));
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
    // Open the color picker modal instead of inline editing
    setEditedName(category.name);
    setIsColorPickerOpen(true);
  };

  const handleModalClose = () => {
    if (editedName.trim() && editedName.trim() !== category.name) {
      onUpdateCategory({ name: editedName.trim() });
    }
    if (editedLogoUrl.trim() !== category.logoUrl) {
      onUpdateCategory({ logoUrl: editedLogoUrl.trim() });
    }
    setIsColorPickerOpen(false);
  };

  const handleColorSelect = (colorNumber: number) => {
    onUpdateCategory({ stroke: colorNumber });
  };

  const currentCompanyGap = category.customCompanyGap ?? settings.companyGap;
  const strokeColor = getStrokeColor(category.stroke);
  
  console.log(`CategoryCard ${category.name}: stroke=${category.stroke}, color=${strokeColor}`);

  return (
    <>
      <ColorPickerModal
        isOpen={isColorPickerOpen}
        onClose={handleModalClose}
        selectedColor={category.stroke}
        onSelectColor={handleColorSelect}
        categoryName={editedName}
        onNameChange={setEditedName}
        categoryLogoUrl={editedLogoUrl}
        onLogoUrlChange={setEditedLogoUrl}
      />
      
      <div
        ref={combineRefs}
        className={`shadow-sm overflow-hidden ${
          isDragging ? "opacity-50" : ""
        } ${isOver && mode === "edit" ? "ring-2 ring-orange-400" : ""}`}
        style={{
          backgroundColor: '#1A1920',
          border: `${settings.cardStrokeSize}px solid ${strokeColor}`,
          borderRadius: '8px',
        }}
      >
        {/* Header */}
        <div 
          className="relative px-4"
          style={{ paddingTop: `${settings.categoryCardGap}px` }}
        >
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
              className="bg-transparent border border-orange-500 rounded px-2 py-1 outline-none w-full"
              style={{
                fontFamily: 'Outfit, sans-serif',
                fontWeight: 700,
                fontStyle: 'normal',
                color: '#FAF4EC'
              }}
              autoFocus
            />
          ) : (
            <div 
              className={`flex items-center ${mode === "preview" ? "" : "pr-16"}`}
              style={{ gap: `${settings.categoryLogoGap}px` }}
            >
              {category.logoUrl && (
                <img
                  src={categoryLogoDataUrl || category.logoUrl}
                  alt={category.name}
                  style={{
                    width: `${settings.categoryLogoSize}px`,
                    height: `${settings.categoryLogoSize}px`,
                    objectFit: 'contain',
                    flexShrink: 0
                  }}
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              )}
              <h3
                style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontWeight: 700,
                  fontStyle: 'normal',
                  fontSize: `${settings.categoryFontSize}px`,
                  color: '#FAF4EC',
                  lineHeight: '120%'
                }}
              >
                {category.name}</h3>
            </div>
          )}
        </div>

        {/* Company Gap Control - Edit Mode Only */}
        {mode === "edit" && (
          <div className="px-4 pb-3 pt-0 flex items-center gap-2 border-t border-white/10">
            <Label className="text-xs whitespace-nowrap" style={{ color: 'rgba(250,244,236,0.5)' }}>Co Gap</Label>
            <Slider
              value={[currentCompanyGap]}
              onValueChange={([value]) => onUpdateCategory({ customCompanyGap: value })}
              min={0}
              max={48}
              step={2}
              className="flex-1"
            />
            <span className="text-xs w-6" style={{ color: 'rgba(250,244,236,0.5)' }}>{currentCompanyGap}</span>
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
          className="px-4"
          style={{
            paddingTop: `${settings.categoryCardGap}px`,
            paddingBottom: `${settings.categoryCardGap}px`,
            display: settings.viewMode === "grid" ? "grid" : "flex",
            ...(settings.viewMode === "grid" ? {
              gridTemplateColumns: `repeat(${settings.companiesPerRow}, minmax(0, 1fr))`,
              gap: `${currentCompanyGap}px`,
            } : {
              flexDirection: "column",
              gap: `${currentCompanyGap}px`,
            }),
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
          {mode === "edit" && <AddCompanyPanel onAddCompany={handleAddCompany} viewMode={settings.viewMode} settings={settings} />}
        </div>
      </div>
    </>
  );
}