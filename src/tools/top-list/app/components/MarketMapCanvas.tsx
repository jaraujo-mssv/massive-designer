import { useRef, useMemo } from "react";
import { Column, Settings } from "../App";
import { ColumnComponent } from "./ColumnComponent";

interface MarketMapCanvasProps {
  columns: Column[];
  setColumns: (columns: Column[]) => void;
  settings: Settings;
  mode: "edit" | "preview";
}

export function MarketMapCanvas({
  columns,
  setColumns,
  settings,
  mode,
}: MarketMapCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleMoveColumn = (fromIndex: number, toIndex: number) => {
    const newColumns = [...columns];
    const [movedColumn] = newColumns.splice(fromIndex, 1);
    newColumns.splice(toIndex, 0, movedColumn);
    setColumns(newColumns);
  };

  const handleDeleteColumn = (columnId: string) => {
    const columnToDelete = columns.find((col) => col.id === columnId);
    if (!columnToDelete) return;

    const remainingColumns = columns.filter((col) => col.id !== columnId);

    // If there are companies in the deleted column, redistribute them
    if (columnToDelete.companies.length > 0 && remainingColumns.length > 0) {
      // Distribute companies to remaining columns
      columnToDelete.companies.forEach((company, index) => {
        const targetColumnIndex = index % remainingColumns.length;
        remainingColumns[targetColumnIndex].companies.push(company);
      });
    }

    setColumns(remainingColumns);
  };

  // Calculate column width based on number of columns (max 5)
  const numColumns = Math.min(columns.length, 5);
  const columnWidth = numColumns > 0 ? `calc((100% - ${settings.columnGap * (numColumns - 1)}px) / ${numColumns})` : '100%';

  // Calculate auto card height if enabled
  const autoCardHeight = useMemo(() => {
    if (!settings.autoCardHeight || columns.length === 0) return undefined;

    // Find the column with the most companies
    const maxCompanies = Math.max(...columns.map(col => col.companies.length));
    if (maxCompanies === 0) return undefined;

    // Return a calculation for equal distribution
    // This will be passed to ColumnComponent to apply to each company card
    return maxCompanies;
  }, [settings.autoCardHeight, columns]);

  return (
    <div
      id="market-map-canvas"
      ref={canvasRef}
      className="h-full w-full overflow-auto"
      style={{
        paddingLeft: `${settings.sitePadding}px`,
        paddingRight: `${settings.sitePadding}px`,
        paddingBottom: `${settings.sitePadding}px`,
        paddingTop: `${settings.sitePadding}px`,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}
    >
      <div
        className={`flex w-full ${settings.autoCardHeight ? 'items-stretch' : 'items-start'}`}
        style={{
          gap: `${settings.columnGap}px`,
        }}
      >
        {columns.map((column, index) => (
          <ColumnComponent
            key={column.id}
            column={column}
            columnIndex={index}
            columns={columns}
            setColumns={setColumns}
            settings={settings}
            mode={mode}
            columnWidth={columnWidth}
            onMoveColumn={handleMoveColumn}
            onDeleteColumn={handleDeleteColumn}
            autoCardHeight={autoCardHeight}
          />
        ))}
      </div>
    </div>
  );
}