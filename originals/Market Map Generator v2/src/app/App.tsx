import { useState, useRef, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { EditControls } from "./components/EditControls";
import { PreviewControls } from "./components/PreviewControls";
import { Toaster, toast } from "sonner";
import { RichTextEditor } from "./components/RichTextEditor";
import { MarketMapCanvas } from "./components/MarketMapCanvas";
import { ModeToggle } from "./components/ModeToggle";
import { LoadingModal } from "./components/LoadingModal";
import Papa from "papaparse";
import { convertToGoogleSheetsTsvUrl } from "./utils/googleSheets";

export interface Company {
  id: string;
  name: string;
  url?: string;
  logoUrl: string;
  subcompanies?: Array<{
    id: string;
    name: string;
    logoUrl: string;
  }>;
}

export interface Category {
  id: string;
  name: string;
  companies: Company[];
  customCompanyGap?: number;
  customCategoryGap?: number; // Custom gap for this specific category
  stroke?: number; // 1-8 color selection
  logoUrl?: string; // Category logo
}

export interface Column {
  id: string;
  categories: Category[];
}

export interface Settings {
  columnGap: number;
  categoryGap: number;
  companyGap: number;
  companiesPerRow: number;
  showFullNames: boolean;
  companyFontSize: number;
  titleGap: number;
  titleFontSize: number;
  titleBold: boolean;
  titleItalic: boolean;
  dateBold: boolean;
  dateItalic: boolean;
  responsiveMode: boolean;
  viewMode: "grid" | "list";
  logoSize: number;
  listItemPadding: number;
  cardStrokeSize: number;
  sitePadding: number;
  topSectionBottomPadding: number;
  logoGap: number;
  categoryFontSize: number;
  categoryLogoSize: number;
  categoryLogoGap: number;
  categoryCardGap: number;
  showPresentedBy: boolean;
}

export default function App() {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [title, setTitle] = useState("MARKET MAP TOOL");
  const [date, setDate] = useState("BY MASSIVE");
  const [hasSelection, setHasSelection] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isLocked, setIsLocked] = useState(false); // Track if loaded from URL parameter
  const [isLoadingUrl, setIsLoadingUrl] = useState(false); // Track URL loading state
  const [activeTab, setActiveTab] = useState<"cards" | "items" | "category" | "title" | "layout" | "settings" | null>("cards"); // Persistent tab state
  const [columns, setColumns] = useState<Column[]>([
    { id: "col-1", categories: [] },
    { id: "col-2", categories: [] },
    { id: "col-3", categories: [] },
  ]);
  const [settings, setSettings] = useState<Settings>({
    columnGap: 16,
    categoryGap: 16,
    companyGap: 4,
    companiesPerRow: 3,
    showFullNames: true,
    companyFontSize: 16,
    titleGap: 0,
    titleFontSize: 44,
    titleBold: true,
    titleItalic: true,
    dateBold: true,
    dateItalic: true,
    responsiveMode: false,
    viewMode: "list",
    logoSize: 24,
    listItemPadding: 0,
    cardStrokeSize: 3,
    sitePadding: 48,
    topSectionBottomPadding: 16,
    logoGap: 12,
    categoryFontSize: 16,
    categoryLogoSize: 24,
    categoryLogoGap: 12,
    categoryCardGap: 16,
    showPresentedBy: true
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load TSV from URL parameter on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const fileUrl = urlParams.get('f');
    const editUrl = urlParams.get('e');
    const responsiveParam = urlParams.get('r');
    
    // Handle ?f= parameter (Preview mode, locked)
    if (fileUrl) {
      // Lock the app in preview mode
      setIsLocked(true);
      setMode("preview");
      
      // Enable responsive mode if r=1
      if (responsiveParam === '1') {
        setSettings(prev => ({ ...prev, responsiveMode: true }));
      }
      
      // Convert Google Sheets URL if needed
      const tsvUrl = convertToGoogleSheetsTsvUrl(fileUrl);
      
      loadDataFromUrl(tsvUrl);
    }
    // Handle ?e= parameter (Edit mode, unlocked)
    else if (editUrl) {
      // Stay in edit mode, unlocked
      setIsLocked(false);
      setMode("edit");
      
      // Convert Google Sheets URL if needed
      const tsvUrl = convertToGoogleSheetsTsvUrl(editUrl);
      
      loadDataFromUrl(tsvUrl);
    }
  }, []); // Run only once on mount

  // Function to load and parse data from URL
  const loadDataFromUrl = (tsvUrl: string) => {
    setIsLoadingUrl(true);
    // Fetch and parse the TSV file
    fetch(tsvUrl)
      .then(response => {
        console.log("Response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to load file: ${response.statusText}`);
        }
        return response.text();
      })
      .then(csvText => {
        console.log("Received text length:", csvText.length);
        console.log("First 500 chars:", csvText.substring(0, 500));
        
        // Check if we got HTML instead of TSV (permission error)
        if (csvText.trim().toLowerCase().startsWith('<!doctype') || 
            csvText.trim().toLowerCase().startsWith('<html')) {
          toast.error("Could not access the file. Make sure the Google Sheet is publicly accessible or shared with 'Anyone with the link can view'");
          return;
        }
        
        if (!csvText.trim()) {
          toast.error("The file is empty");
          return;
        }
        
        // Split into lines to process metadata
        const lines = csvText.split('\n');
        const metadataRows: string[] = [];
        const dataRows: string[] = [];
        
        let inMetadata = true;
        for (const line of lines) {
          if (line.startsWith('__')) {
            metadataRows.push(line);
          } else {
            if (inMetadata) {
              inMetadata = false;
            }
            dataRows.push(line);
          }
        }
        
        // Process metadata
        let loadedTitle = "Market Map";
        let loadedDate = "January 2026";
        let columnCount = 3;
        const loadedSettings: Partial<Settings> = {};
        
        metadataRows.forEach(row => {
          const parts = row.split('\t');
          if (parts[0] === '__TITLE__' && parts[1]) {
            loadedTitle = parts[1];
          } else if (parts[0] === '__DATE__' && parts[1]) {
            loadedDate = parts[1];
          } else if (parts[0] === '__COLUMNS__' && parts[1]) {
            columnCount = parseInt(parts[1]) || 3;
          } else if (parts[0].startsWith('__SETTING__')) {
            const settingKey = parts[0].replace('__SETTING__', '');
            const settingValue = parts[1];
            
            // Parse the value appropriately
            if (settingValue.toLowerCase() === 'true') {
              loadedSettings[settingKey as keyof Settings] = true as any;
            } else if (settingValue.toLowerCase() === 'false') {
              loadedSettings[settingKey as keyof Settings] = false as any;
            } else if (!isNaN(Number(settingValue))) {
              loadedSettings[settingKey as keyof Settings] = Number(settingValue) as any;
            } else {
              loadedSettings[settingKey as keyof Settings] = settingValue as any;
            }
          }
        });
        
        // Apply loaded metadata
        setTitle(loadedTitle);
        setDate(loadedDate);
        if (Object.keys(loadedSettings).length > 0) {
          setSettings(prev => ({ ...prev, ...loadedSettings }));
        }

        // Parse the data rows as TSV
        const dataText = dataRows.join('\n');
        Papa.parse<{ category: string; company: string; logo: string; url?: string; stroke?: string; subcompanies?: string; columnGap?: string }>(dataText, {
          header: true,
          skipEmptyLines: true,
          delimiter: '\t',
          complete: (results) => {
            if (results.errors.length > 0) {
              console.error("TSV parsing errors:", results.errors);
              toast.error("Error parsing TSV file from URL");
              return;
            }

            if (results.data.length === 0) {
              toast.error("TSV file is empty");
              return;
            }

            // Group companies by category AND stroke number
            const categoryMap = new Map<string, { categoryName: string; companies: Company[]; stroke?: number; logoUrl?: string; customCategoryGap?: number; customCompanyGap?: number }>();

            results.data.forEach((row, index) => {
              // Skip completely empty rows
              if (!row.category && !row.company && !row.logo) {
                return;
              }
              
              // Check if this is a category row (has category but no company)
              // This includes: empty category rows, category logos, and category settings
              if (row.category && !row.company) {
                let stroke: number | undefined = undefined;
                if (row.stroke) {
                  const strokeValue = parseInt(row.stroke);
                  if (!isNaN(strokeValue) && strokeValue >= 1 && strokeValue <= 8) {
                    stroke = strokeValue;
                  }
                }
                
                // Parse customCategoryGap from columnGap field (new format)
                let customCategoryGap: number | undefined = undefined;
                if (row.columnGap) {
                  const gapValue = parseInt(row.columnGap);
                  if (!isNaN(gapValue) && gapValue >= 0 && gapValue <= 48) {
                    customCategoryGap = gapValue;
                  }
                }
                
                // Parse customCompanyGap from URL field (Co Gap)
                let customCompanyGap: number | undefined = undefined;
                if (row.url && row.url.trim()) {
                  const coGapValue = parseInt(row.url.trim());
                  if (!isNaN(coGapValue) && coGapValue >= 0 && coGapValue <= 48) {
                    customCompanyGap = coGapValue;
                  }
                }
                
                const mapKey = `${row.category}-${stroke ?? 'default'}`;
                
                if (!categoryMap.has(mapKey)) {
                  categoryMap.set(mapKey, { categoryName: row.category, companies: [], stroke, logoUrl: row.logo || undefined, customCategoryGap, customCompanyGap });
                } else {
                  const existingCategory = categoryMap.get(mapKey)!;
                  if (row.logo) {
                    existingCategory.logoUrl = row.logo;
                  }
                  if (customCategoryGap !== undefined) {
                    existingCategory.customCategoryGap = customCategoryGap;
                  }
                  if (customCompanyGap !== undefined) {
                    existingCategory.customCompanyGap = customCompanyGap;
                  }
                }
                
                return;
              }
              
              // Regular company row
              if (!row.category || !row.company || !row.logo) {
                return;
              }

              const company: Company = {
                id: `company-${Date.now()}-${Math.random()}`,
                name: row.company,
                logoUrl: row.logo,
                url: row.url,
                subcompanies: row.subcompanies && row.subcompanies.trim() ? 
                  row.subcompanies.split(';').map((sub, idx) => {
                    const [subName, subLogo] = sub.split('|');
                    return { 
                      id: `sub-${Date.now()}-${Math.random()}-${idx}`,
                      name: subName?.trim() || '', 
                      logoUrl: subLogo?.trim() || '' 
                    };
                  }).filter(sub => sub.name && sub.logoUrl) : 
                  undefined,
              };

              let stroke: number | undefined = undefined;
              if (row.stroke) {
                const strokeValue = parseInt(row.stroke);
                if (!isNaN(strokeValue) && strokeValue >= 1 && strokeValue <= 8) {
                  stroke = strokeValue;
                }
              }

              let customCategoryGap: number | undefined = undefined;
              if (row.columnGap) {
                const gapValue = parseInt(row.columnGap);
                if (!isNaN(gapValue) && gapValue >= 0 && gapValue <= 48) {
                  customCategoryGap = gapValue;
                }
              }

              const mapKey = `${row.category}-${stroke ?? 'default'}`;

              if (!categoryMap.has(mapKey)) {
                categoryMap.set(mapKey, { categoryName: row.category, companies: [], stroke, customCategoryGap });
              }
              categoryMap.get(mapKey)!.companies.push(company);
            });

            // Convert to categories
            const categories: Category[] = Array.from(categoryMap.values()).map(
              ({ categoryName, companies, stroke, logoUrl, customCategoryGap, customCompanyGap }) => ({
                id: `category-${Date.now()}-${Math.random()}`,
                name: categoryName,
                companies,
                stroke,
                logoUrl,
                customCategoryGap,
                customCompanyGap,
              })
            );

            // Create columns based on loaded column count
            const newColumns: Column[] = [];
            for (let i = 0; i < columnCount; i++) {
              newColumns.push({ id: `col-${i + 1}`, categories: [] });
            }

            // Distribute categories across columns
            categories.forEach((category, index) => {
              const columnIndex = index % columnCount;
              newColumns[columnIndex].categories.push(category);
            });

            setColumns(newColumns);
            toast.success("Market map loaded successfully");
          },
        });
      })
      .catch(error => {
        console.error("Error loading TSV from URL:", error);
        toast.error("Failed to load market map from URL");
      })
      .finally(() => {
        setIsLoadingUrl(false);
      });
  }

  // Auto-hide controls in preview mode
  useEffect(() => {
    if (mode === "preview") {
      const handleMouseMove = () => {
        setShowControls(true);
        
        // Clear existing timer
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }
        
        // Set new timer to hide after 1 second of inactivity
        idleTimerRef.current = setTimeout(() => {
          setShowControls(false);
        }, 1000);
      };

      const handleClick = () => {
        setShowControls(true);
        
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }
        
        idleTimerRef.current = setTimeout(() => {
          setShowControls(false);
        }, 1000);
      };

      // Add event listeners
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('click', handleClick);

      // Initial timer
      idleTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 1000);

      // Cleanup
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('click', handleClick);
        if (idleTimerRef.current) {
          clearTimeout(idleTimerRef.current);
        }
      };
    } else {
      // Always show controls in edit mode
      setShowControls(true);
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    }
  }, [mode]);

  return (
    <DndProvider backend={HTML5Backend}>
      <Toaster position="top-center" richColors />
      <LoadingModal isOpen={isLoadingUrl} />
      <div
        className={`w-screen flex flex-col ${mode === "edit" ? "h-screen overflow-hidden" : "min-h-screen overflow-auto"}`}
        style={{
          background: "radial-gradient(circle at center, #F7F8FD 0%, #F6F8FF 100%)",
        }}
      >
        {/* Mode Toggle - Top Right (outside export area) */}
        {!isLocked && (
          <div className="absolute top-4 right-4 z-10">
            <div 
              className={`transition-opacity duration-300 ${
                mode === "preview" && !showControls ? "opacity-0 pointer-events-none" : "opacity-100"
              }`}
            >
              <ModeToggle 
                mode={mode} 
                setMode={setMode}
              />
            </div>
          </div>
        )}

        {/* Content wrapper for export */}
        <div id="market-map-export-area" className={mode === "edit" ? "flex-1 overflow-hidden flex flex-col" : ""}>
          {/* Top Bar */}
          <div 
            className="flex items-center bg-transparent gap-6 relative"
            style={{
              paddingLeft: `${settings.sitePadding}px`,
              paddingRight: `${settings.sitePadding}px`,
              paddingTop: `${settings.sitePadding}px`,
              paddingBottom: `${settings.topSectionBottomPadding}px`
            }}
          >
            <div className="flex-1 flex flex-col" style={{ gap: `${settings.titleGap}px` }}>
              <RichTextEditor
                value={title}
                onChange={setTitle}
                disabled={mode === "preview"}
                onSelectionChange={setHasSelection}
                className="bg-transparent border-none outline-none focus:ring-2 focus:ring-orange-500 rounded min-h-[40px]"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  background: 'linear-gradient(180deg, #0C2235 0%, #4C586A 50%, #0C2235 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: `${settings.titleFontSize}px`,
                  padding: '2px 8px',
                  lineHeight: '100%',
                  fontWeight: settings.titleBold ? 900 : 'normal',
                  fontStyle: settings.titleItalic ? 'italic' : 'normal'
                }}
              />
              <RichTextEditor
                value={date}
                onChange={setDate}
                disabled={mode === "preview"}
                onSelectionChange={setHasSelection}
                className="bg-transparent border-none outline-none focus:ring-2 focus:ring-orange-500 rounded min-h-[40px]"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  background: 'linear-gradient(180deg, #FF7001 0%, #FFB601 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  fontSize: `${settings.titleFontSize}px`,
                  padding: '2px 8px',
                  lineHeight: '100%',
                  fontWeight: settings.dateBold ? 900 : 'normal',
                  fontStyle: settings.dateItalic ? 'italic' : 'normal'
                }}
              />
            </div>
            {settings.showPresentedBy && (
              <div
                className="flex flex-col items-end justify-center gap-0"
                style={{
                  fontFamily: 'Inter, sans-serif',
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
            )}
          </div>

          {/* Main Canvas */}
          <div className={mode === "edit" ? "flex-1 overflow-hidden" : ""} ref={canvasRef}>
            <MarketMapCanvas
              columns={columns}
              setColumns={setColumns}
              settings={settings}
              mode={mode}
            />
          </div>
        </div>

        {/* Bottom Controls (outside export area) */}
        <div className="fixed bottom-6 left-6 right-6 flex flex-col sm:flex-row justify-between items-end gap-3 pointer-events-none">
          <div className="pointer-events-auto">
            {mode === "edit" && !isLocked && (
              <EditControls
                settings={settings}
                setSettings={setSettings}
                columns={columns}
                setColumns={setColumns}
                setTitle={setTitle}
                setDate={setDate}
                title={title}
                date={date}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
              />
            )}
            {mode === "preview" && !isLocked && (
              <div
                className={`transition-opacity duration-300 ${
                  !showControls ? "opacity-0 pointer-events-none" : "opacity-100"
                }`}
              >
                <PreviewControls
                  settings={settings}
                  columns={columns}
                  title={title}
                  date={date}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}