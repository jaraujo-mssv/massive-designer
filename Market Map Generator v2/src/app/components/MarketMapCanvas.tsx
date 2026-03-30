import { useRef, useMemo, useState, useEffect } from "react";
import { Column, Settings, Category } from "../App";
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
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  // Track screen size for responsive mode
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      if (width < 768) {
        setScreenSize('mobile');
      } else if (width < 1024) {
        setScreenSize('tablet');
      } else {
        setScreenSize('desktop');
      }
    };

    handleResize(); // Initial check
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

    // If there are categories in the deleted column, redistribute them
    if (columnToDelete.categories.length > 0 && remainingColumns.length > 0) {
      // Distribute categories to remaining columns
      columnToDelete.categories.forEach((category, index) => {
        const targetColumnIndex = index % remainingColumns.length;
        remainingColumns[targetColumnIndex].categories.push(category);
      });
    }

    setColumns(remainingColumns);
  };

  // Compute display columns based on responsive mode
  const displayColumns = useMemo(() => {
    // Only apply responsive mode in preview mode
    if (!settings.responsiveMode || mode !== 'preview') {
      return columns;
    }

    // Determine number of columns based on screen size
    let numResponsiveColumns = 4; // desktop default
    if (screenSize === 'mobile') {
      numResponsiveColumns = 1;
    } else if (screenSize === 'tablet') {
      numResponsiveColumns = 2;
    }

    // Gather all categories from all columns
    const allCategories: Category[] = [];
    columns.forEach(col => {
      allCategories.push(...col.categories);
    });

    // Create new columns for display
    const newColumns: Column[] = [];
    for (let i = 0; i < numResponsiveColumns; i++) {
      newColumns.push({ id: `responsive-col-${i}`, categories: [] });
    }

    // Distribute categories round-robin
    allCategories.forEach((category, index) => {
      const columnIndex = index % numResponsiveColumns;
      newColumns[columnIndex].categories.push(category);
    });

    return newColumns;
  }, [columns, settings.responsiveMode, mode, screenSize]);

  // Calculate column width based on number of display columns
  const numColumns = displayColumns.length;
  const columnWidth = numColumns > 0 ? `calc((100% - ${settings.columnGap * (numColumns - 1)}px) / ${numColumns})` : '100%';

  return (
    <div
      id="market-map-canvas"
      ref={canvasRef}
      className={mode === "edit" ? "h-full w-full overflow-auto" : "w-full"}
      style={{
        paddingLeft: `${settings.sitePadding}px`,
        paddingRight: `${settings.sitePadding}px`,
        paddingBottom: `${settings.sitePadding}px`
      }}
    >
      <div
        className="flex items-start min-h-full"
        style={{
          gap: `${settings.columnGap}px`,
        }}
      >
        {displayColumns.map((column, displayIndex) => {
          // Find the actual index in the original columns array
          const actualIndex = columns.findIndex(col => col.id === column.id);
          
          return (
          <ColumnComponent
            key={column.id}
            column={column}
            columnIndex={actualIndex !== -1 ? actualIndex : displayIndex}
            columns={columns}
            setColumns={setColumns}
            settings={settings}
            mode={mode}
            columnWidth={columnWidth}
            onMoveColumn={handleMoveColumn}
            onDeleteColumn={handleDeleteColumn}
          />
        );
        })}
      </div>
    </div>
  );
}