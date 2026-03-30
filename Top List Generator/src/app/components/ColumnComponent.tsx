import { useDrag, useDrop } from "react-dnd";
import { Trash2 } from "lucide-react";
import { Column, Company, Settings } from "../App";
import { CompanyCard } from "./CompanyCard";
import { AddCompanyPanel } from "./AddCompanyPanel";

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
  autoCardHeight?: number;
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
  autoCardHeight,
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

  // Make the column accept company card drops (for empty columns)
  const [{ isOver: isOverCompany }, dropCompany] = useDrop(
    () => ({
      accept: "COMPANY_CARD",
      drop: (item: { columnIndex: number; companyIndex: number }, monitor) => {
        // Only handle if not dropped on a nested target
        if (monitor.didDrop()) {
          return;
        }
        // Move company to the end of this column
        handleMoveCompany(
          item.columnIndex,
          item.companyIndex,
          columnIndex,
          column.companies.length
        );
      },
      collect: (monitor) => ({
        isOver: monitor.isOver({ shallow: true }),
      }),
    }),
    [columnIndex, column.companies.length]
  );

  const handleMoveCompany = (
    fromColumnIndex: number,
    fromCompanyIndex: number,
    toColumnIndex: number,
    toCompanyIndex: number
  ) => {
    const newColumns = [...columns];
    const [movedCompany] = newColumns[fromColumnIndex].companies.splice(
      fromCompanyIndex,
      1
    );
    newColumns[toColumnIndex].companies.splice(
      toCompanyIndex,
      0,
      movedCompany
    );
    setColumns(newColumns);
  };

  const handleAddCompany = (company: Company) => {
    const newColumns = [...columns];
    newColumns[columnIndex].companies.push(company);
    setColumns(newColumns);
  };

  const handleUpdateCompany = (
    companyIndex: number,
    updates: Partial<Company>
  ) => {
    const newColumns = [...columns];
    newColumns[columnIndex].companies[companyIndex] = {
      ...newColumns[columnIndex].companies[companyIndex],
      ...updates,
    };
    setColumns(newColumns);
  };

  const handleDeleteCompany = (companyIndex: number) => {
    const newColumns = [...columns];
    newColumns[columnIndex].companies.splice(companyIndex, 1);
    setColumns(newColumns);
  };

  const combineRefs = (node: HTMLDivElement | null) => {
    if (mode === "edit") {
      drag(node);
      dropColumn(node);
      dropCompany(node);
    }
  };

  return (
    <div
      ref={combineRefs}
      className={`flex-shrink-0 ${isDragging ? "opacity-50" : ""} ${
        isOverColumn && mode === "edit" ? "ring-2 ring-orange-400" : ""
      } ${
        isOverCompany && mode === "edit" ? "ring-2 ring-orange-400" : ""
      }`}
      style={{
        width: columnWidth,
        minHeight: "200px",
        ...(autoCardHeight && {
          display: 'flex',
          flexDirection: 'column'
        })
      }}
    >
      <div
        className="flex flex-col h-full"
        style={{ 
          gap: `${settings.companyGap}px`,
          ...(autoCardHeight && {
            flex: 1,
            minHeight: 0
          })
        }}
      >
        {/* Column Header (Edit mode only) */}
        {mode === "edit" && (
          <div className="flex items-center justify-between px-2 py-1 bg-gray-100 rounded-lg border border-gray-200">
            <span className="text-xs font-medium text-gray-500">
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

        {/* Companies */}
        {column.companies.map((company, companyIndex) => (
          <CompanyCard
            key={company.id}
            company={company}
            columnIndex={columnIndex}
            companyIndex={companyIndex}
            mode={mode}
            settings={settings}
            onMoveCompany={handleMoveCompany}
            onUpdateCompany={(updates) =>
              handleUpdateCompany(companyIndex, updates)
            }
            onDeleteCompany={() => handleDeleteCompany(companyIndex)}
          />
        ))}

        {/* Add Company Panel (Edit mode only) */}
        {mode === "edit" && <AddCompanyPanel onAddCompany={handleAddCompany} settings={settings} />}

        {/* Empty state for drop target */}
        {mode === "edit" && column.companies.length === 0 && (
          <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 text-gray-400 text-sm">
            Drag cards here
          </div>
        )}
      </div>
    </div>
  );
}
