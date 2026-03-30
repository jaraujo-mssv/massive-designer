import { useState, useRef, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Toaster, toast } from "sonner";
import Papa from "papaparse";
import { MarketMapCanvas } from "./components/MarketMapCanvas";
import { ThumbnailCanvas } from "./components/ThumbnailCanvas";
import { ModeToggle } from "./components/ModeToggle";
import { EditControls } from "./components/EditControls";
import { RichTextEditor } from "./components/RichTextEditor";
import { ScreenshotModal } from "./components/ScreenshotModal";
import { useScreenshot } from "./hooks/useScreenshot";

export interface Company {
  id: string;
  position: number;
  name: string;
  url?: string;
  logoUrl: string;
}

export interface Column {
  id: string;
  companies: Company[];
}

export interface Settings {
  columnGap: number;
  categoryGap: number;
  companyGap: number;
  showFullNames: boolean;
  companyFontSize: number;
  titleGap: number;
  titleFontSize: number;
  subtitleFontSize: number;
  titleBold: boolean;
  titleItalic: boolean;
  titleLineHeight: number;
  logoSize: number;
  cardStrokeSize: number;
  sitePadding: number;
  topSectionBottomPadding: number;
  positionFontSize: number;
  positionWidth: number;
  cardMinHeight: number;
  // Thumbnail settings
  thumbnailLogoSize: number;
  thumbnailLogoPadding: number;
  thumbnailRowPadding: number;
  thumbnailRowOffset: number;
  thumbnailRotation: number;
  thumbnailOpacity: number;
  thumbnailOffsetX: number;
  thumbnailOffsetY: number;
  thumbnailTitleFontSize: number;
  thumbnailDateFontSize: number;
  thumbnailShowText: boolean;
}

export default function App() {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [layout, setLayout] = useState<"list" | "thumbnail">("list");
  const [title, setTitle] = useState("<b><i>Top List Companies</i></b>");
  const [date, setDate] = useState("<b><i>January 2026</i></b>");
  const [hasSelection, setHasSelection] = useState(false);
  const [columns, setColumns] = useState<Column[]>([
    { id: "col-1", companies: [] },
    { id: "col-2", companies: [] },
  ]);
  const [settings, setSettings] = useState<Settings>({
    columnGap: 12,
    categoryGap: 24,
    companyGap: 12,
    showFullNames: true,
    companyFontSize: 18,
    titleGap: 0,
    titleFontSize: 50,
    subtitleFontSize: 36,
    titleBold: true,
    titleItalic: true,
    titleLineHeight: 1.2,
    logoSize: 48,
    cardStrokeSize: 2,
    sitePadding: 60,
    topSectionBottomPadding: 0,
    positionFontSize: 24,
    positionWidth: 35,
    cardMinHeight: 94,
    // Thumbnail settings
    thumbnailLogoSize: 48,
    thumbnailLogoPadding: 10,
    thumbnailRowPadding: 20,
    thumbnailRowOffset: 5,
    thumbnailRotation: 0,
    thumbnailOpacity: 1,
    thumbnailOffsetX: 0,
    thumbnailOffsetY: 0,
    thumbnailTitleFontSize: 36,
    thumbnailDateFontSize: 24,
    thumbnailShowText: true
  });
  
  // Remember toolbar state when switching between modes
  const [toolbarState, setToolbarState] = useState<{
    isOpen: boolean;
    activeTab: "cards" | "title" | "layout" | "thumbnail" | null;
  }>({
    isOpen: true,
    activeTab: "cards"
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const { takeScreenshot, isTakingScreenshot, screenshotUrl } = useScreenshot(canvasRef);

  // Helper function to convert Google Sheets URL to TSV export URL
  const convertGoogleSheetsUrl = (url: string): string | null => {
    try {
      const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) {
        const spreadsheetId = match[1];
        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=tsv`;
      }
      return null;
    } catch (error) {
      console.error("Error parsing URL:", error);
      return null;
    }
  };

  // Process data from TSV content
  const processDataContent = (tsvContent: string, sourceName: string = "file") => {
    // Check for metadata rows (__TITLE__, __DATE__, __COLUMNS__, __SETTING__)
    const lines = tsvContent.split('\n');
    let titleValue = "";
    let dateValue = "";
    let columnsCount: number | null = null;
    const parsedSettings: Partial<Settings> = {};
    let dataStartIndex = 0;

    // Parse metadata rows
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      if (line.startsWith('__TITLE__')) {
        const parts = line.split('\t');
        titleValue = parts[1]?.trim() || "";
        dataStartIndex = i + 1;
      } else if (line.startsWith('__DATE__')) {
        const parts = line.split('\t');
        dateValue = parts[1]?.trim() || "";
        dataStartIndex = i + 1;
      } else if (line.startsWith('__COLUMNS__')) {
        const parts = line.split('\t');
        columnsCount = parseInt(parts[1]?.trim() || "2", 10);
        dataStartIndex = i + 1;
      } else if (line.startsWith('__SETTING__')) {
        const parts = line.split('\t');
        const settingLine = parts[0];
        const settingValue = parts[1]?.trim() || "";
        
        // Extract setting name from __SETTING__settingName
        const settingName = settingLine.replace('__SETTING__', '');
        
        // Parse the value based on the setting type
        if (settingName === 'showFullNames' || settingName === 'titleBold' || settingName === 'titleItalic' || settingName === 'thumbnailShowText') {
          // Boolean values
          parsedSettings[settingName as keyof Settings] = settingValue === 'true' as any;
        } else {
          // Numeric values
          parsedSettings[settingName as keyof Settings] = parseFloat(settingValue) as any;
        }
        
        dataStartIndex = i + 1;
      } else if (line.includes('position') && line.includes('company')) {
        // Found the header row, data starts here
        break;
      }
    }

    // Set title and date if found
    if (titleValue) {
      setTitle(`<b><i>${titleValue}</i></b>`);
    }
    if (dateValue) {
      setDate(`<b><i>${dateValue}</i></b>`);
    }
    
    // Apply parsed settings if any were found
    if (Object.keys(parsedSettings).length > 0) {
      setSettings(prevSettings => ({
        ...prevSettings,
        ...parsedSettings
      }));
      console.log("Settings imported:", parsedSettings);
    }

    // Remove metadata rows and reconstruct content
    const contentToProcess = lines.slice(dataStartIndex).join('\n');

    Papa.parse<{ position: string; company: string; logo: string; url?: string }>(contentToProcess, {
      header: true,
      skipEmptyLines: true,
      delimiter: '\t',
      complete: (results) => {
        console.log("Data parsed:", results);

        if (results.errors.length > 0) {
          console.error("Data parsing errors:", results.errors);
          toast.error("Error parsing data");
          return;
        }

        if (results.data.length === 0) {
          toast.error("Data is empty");
          return;
        }

        // Create companies from data
        const companies: Company[] = [];

        results.data.forEach((row, index) => {
          console.log(`Row ${index}:`, row);
          if (!row.position || !row.company || !row.logo) {
            console.warn(`Skipping row ${index} - missing required fields:`, row);
            return;
          }

          const company: Company = {
            id: `company-${Date.now()}-${Math.random()}`,
            position: parseInt(row.position, 10),
            name: row.company,
            logoUrl: row.logo,
            url: row.url,
          };

          companies.push(company);
        });

        if (companies.length === 0) {
          toast.error("No valid data found. Make sure columns are: position, company, logo, url");
          return;
        }

        // Sort companies by position
        companies.sort((a, b) => a.position - b.position);

        // Distribute companies across columns (use columnsCount if provided, otherwise default to 2)
        const numColumns = columnsCount || 2;
        const newColumns: Column[] = [];
        
        for (let i = 0; i < numColumns; i++) {
          newColumns.push({
            id: `col-${Date.now()}-${i}`,
            companies: []
          });
        }

        companies.forEach((company, index) => {
          const columnIndex = index % numColumns;
          newColumns[columnIndex].companies.push(company);
        });

        console.log("Setting columns:", newColumns);
        setColumns(newColumns);
        
        const settingsImported = Object.keys(parsedSettings).length > 0;
        const successMessage = settingsImported 
          ? `Loaded ${companies.length} companies and ${Object.keys(parsedSettings).length} settings from ${sourceName}`
          : `Loaded ${companies.length} companies from ${sourceName}`;
        toast.success(successMessage);
      },
      error: (error) => {
        console.error("Data parsing error:", error);
        toast.error(`Failed to parse data: ${error.message}`);
      },
    });
  };

  // Check URL parameters on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const embedUrl = urlParams.get('e');
    
    if (embedUrl) {
      console.log("Found URL parameter 'e':", embedUrl);
      
      const tsvUrl = convertGoogleSheetsUrl(embedUrl);
      
      if (!tsvUrl) {
        toast.error("Invalid Google Sheets URL in parameter");
        return;
      }

      console.log("Auto-importing from:", tsvUrl);
      toast.loading("Loading data from Google Sheets...");

      fetch(tsvUrl)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
          }
          return response.text();
        })
        .then(tsvContent => {
          console.log("TSV content fetched, length:", tsvContent.length);
          toast.dismiss();
          processDataContent(tsvContent, "Google Sheets");
        })
        .catch(error => {
          console.error("Error fetching URL:", error);
          toast.dismiss();
          toast.error(`Failed to import from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
        });
    }
  }, []);

  return (
    <DndProvider backend={HTML5Backend}>
      <Toaster position="top-center" richColors />
      <div
        ref={canvasRef}
        className="h-screen w-screen flex flex-col overflow-hidden"
        style={{
          background: "radial-gradient(circle at center, #F7F8FD 0%, #F6F8FF 100%)",
        }}
      >
        {/* Mode Toggle - Top Right */}
        <div className="fixed top-6 right-6 z-50 pointer-events-auto">
          <ModeToggle mode={mode} setMode={setMode} />
        </div>

        {/* Top Bar - Centered Title */}
        <div 
          className="flex flex-col items-center justify-center bg-transparent"
          style={{
            paddingLeft: `${settings.sitePadding}px`,
            paddingRight: `${settings.sitePadding}px`,
            paddingTop: `${settings.sitePadding}px`,
            paddingBottom: `${settings.topSectionBottomPadding}px`,
            gap: `${settings.titleGap}px`,
            display: layout === "thumbnail" ? "none" : "flex"
          }}
        >
          <RichTextEditor
            value={title}
            onChange={setTitle}
            disabled={mode === "preview"}
            onSelectionChange={setHasSelection}
            className="bg-transparent border-none outline-none focus:ring-2 focus:ring-orange-500 rounded min-h-[40px] text-center"
            style={{
              fontFamily: 'Inter, sans-serif',
              background: 'linear-gradient(180deg, #0C2235 0%, #4C586A 50%, #0C2235 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: `${settings.titleFontSize}px`,
              padding: '2px 8px',
              lineHeight: `${settings.titleLineHeight}`
            }}
          />
          <RichTextEditor
            value={date}
            onChange={setDate}
            disabled={mode === "preview"}
            onSelectionChange={setHasSelection}
            className="bg-transparent border-none outline-none focus:ring-2 focus:ring-orange-500 rounded min-h-[40px] text-center"
            style={{
              fontFamily: 'Inter, sans-serif',
              background: 'linear-gradient(180deg, #FF7001 0%, #FFB601 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              fontSize: `${settings.subtitleFontSize}px`,
              padding: '2px 8px',
              lineHeight: `${settings.titleLineHeight}`
            }}
          />
        </div>

        {/* Main Canvas */}
        <div className="flex-1 overflow-hidden flex flex-col justify-center">
          {layout === "list" ? (
            <MarketMapCanvas
              columns={columns}
              setColumns={setColumns}
              settings={settings}
              mode={mode}
            />
          ) : (
            <ThumbnailCanvas
              columns={columns}
              title={title}
              date={date}
              settings={settings}
            />
          )}
        </div>
        
        {/* Presented By - Bottom */}
        <div
          className="flex flex-col items-center justify-center gap-1"
          style={{
            fontFamily: 'Inter, sans-serif',
            paddingBottom: `${settings.sitePadding}px`,
            paddingTop: `${settings.topSectionBottomPadding}px`,
            display: layout === "thumbnail" ? "none" : "flex"
          }}
        >
          <div
            style={{
              fontWeight: 800,
              fontStyle: 'italic',
              fontSize: '16px',
              letterSpacing: '0.5px',
              background: 'linear-gradient(180deg, #0C2235 0%, #4C586A 50%, #0C2235 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
              opacity: 0.75
            }}
          >
            PRESENTED BY
          </div>
          <img 
            src="https://cdn.prod.website-files.com/5e4e54db58d02b857909aa5e/677c104f2035b24d5685c8f2_logo-positive.svg" 
            alt="Massive Logo"
            style={{ height: '48px', width: 'auto' }}
          />
        </div>

        {/* Bottom Controls */}
        <div className="fixed bottom-6 left-6 right-6 flex justify-start pointer-events-none">
          <div className="pointer-events-auto">
            {mode === "edit" && (
              <EditControls
                settings={settings}
                setSettings={setSettings}
                columns={columns}
                setColumns={setColumns}
                setTitle={setTitle}
                setDate={setDate}
                title={title}
                date={date}
                toolbarState={toolbarState}
                setToolbarState={setToolbarState}
                layout={layout}
                setLayout={setLayout}
              />
            )}
          </div>
        </div>

        {/* Screenshot Modal */}
        <ScreenshotModal
          isTakingScreenshot={isTakingScreenshot}
          screenshotUrl={screenshotUrl}
          takeScreenshot={takeScreenshot}
        />
      </div>
    </DndProvider>
  );
}