import { useState } from "react";
import { Upload, Layers, Heading, LayoutDashboard, Link, Image, Download } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Column, Settings, Company } from "../App";
import { SliderWithInput } from "./SliderWithInput";

interface EditControlsProps {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  columns: Column[];
  setColumns: (columns: Column[]) => void;
  setTitle: (title: string) => void;
  setDate: (date: string) => void;
  title: string;
  date: string;
  toolbarState: {
    isOpen: boolean;
    activeTab: "cards" | "title" | "layout" | "thumbnail" | null;
  };
  setToolbarState: (state: { isOpen: boolean; activeTab: "cards" | "title" | "layout" | "thumbnail" | null }) => void;
  layout: "list" | "thumbnail";
  setLayout: (layout: "list" | "thumbnail") => void;
}

export function EditControls({
  settings,
  setSettings,
  columns,
  setColumns,
  setTitle,
  setDate,
  title,
  date,
  toolbarState,
  setToolbarState,
  layout,
  setLayout,
}: EditControlsProps) {
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  // Handle column count changes
  const handleColumnCountChange = (newCount: number) => {
    // Get all companies from current columns
    const allCompanies: Company[] = [];
    columns.forEach(col => {
      allCompanies.push(...col.companies);
    });

    // Sort by position
    allCompanies.sort((a, b) => a.position - b.position);

    // Distribute companies across new column count
    const newColumns: Column[] = [];
    for (let i = 0; i < newCount; i++) {
      newColumns.push({
        id: `col-${Date.now()}-${i}`,
        companies: []
      });
    }

    allCompanies.forEach((company, index) => {
      const columnIndex = index % newCount;
      newColumns[columnIndex].companies.push(company);
    });

    setColumns(newColumns);
  };

  // Export data and settings to TSV
  const handleExportData = () => {
    // Get all companies from columns
    const allCompanies: Company[] = [];
    columns.forEach(col => {
      allCompanies.push(...col.companies);
    });
    
    // Sort by position
    allCompanies.sort((a, b) => a.position - b.position);
    
    // Extract clean title and date (remove HTML tags)
    const titleElement = document.createElement('div');
    titleElement.innerHTML = title;
    const cleanTitle = titleElement.textContent || titleElement.innerText || '';
    
    const dateElement = document.createElement('div');
    dateElement.innerHTML = date;
    const cleanDate = dateElement.textContent || dateElement.innerText || '';
    
    // Build TSV content with metadata rows
    let tsvContent = '';
    
    // Add __TITLE__ metadata row
    tsvContent += `__TITLE__\t${cleanTitle}\n`;
    
    // Add __DATE__ metadata row
    tsvContent += `__DATE__\t${cleanDate}\n`;
    
    // Add __COLUMNS__ metadata row
    tsvContent += `__COLUMNS__\t${columns.length}\n`;
    
    // Add individual setting rows
    tsvContent += `__SETTING__columnGap\t${settings.columnGap}\n`;
    tsvContent += `__SETTING__categoryGap\t${settings.categoryGap}\n`;
    tsvContent += `__SETTING__companyGap\t${settings.companyGap}\n`;
    tsvContent += `__SETTING__showFullNames\t${settings.showFullNames}\n`;
    tsvContent += `__SETTING__companyFontSize\t${settings.companyFontSize}\n`;
    tsvContent += `__SETTING__titleGap\t${settings.titleGap}\n`;
    tsvContent += `__SETTING__titleFontSize\t${settings.titleFontSize}\n`;
    tsvContent += `__SETTING__subtitleFontSize\t${settings.subtitleFontSize}\n`;
    tsvContent += `__SETTING__titleBold\t${settings.titleBold}\n`;
    tsvContent += `__SETTING__titleItalic\t${settings.titleItalic}\n`;
    tsvContent += `__SETTING__titleLineHeight\t${settings.titleLineHeight}\n`;
    tsvContent += `__SETTING__logoSize\t${settings.logoSize}\n`;
    tsvContent += `__SETTING__cardStrokeSize\t${settings.cardStrokeSize}\n`;
    tsvContent += `__SETTING__sitePadding\t${settings.sitePadding}\n`;
    tsvContent += `__SETTING__topSectionBottomPadding\t${settings.topSectionBottomPadding}\n`;
    tsvContent += `__SETTING__positionFontSize\t${settings.positionFontSize}\n`;
    tsvContent += `__SETTING__positionWidth\t${settings.positionWidth}\n`;
    tsvContent += `__SETTING__cardMinHeight\t${settings.cardMinHeight}\n`;
    tsvContent += `__SETTING__thumbnailLogoSize\t${settings.thumbnailLogoSize}\n`;
    tsvContent += `__SETTING__thumbnailLogoPadding\t${settings.thumbnailLogoPadding}\n`;
    tsvContent += `__SETTING__thumbnailRowPadding\t${settings.thumbnailRowPadding}\n`;
    tsvContent += `__SETTING__thumbnailRowOffset\t${settings.thumbnailRowOffset}\n`;
    tsvContent += `__SETTING__thumbnailRotation\t${settings.thumbnailRotation}\n`;
    tsvContent += `__SETTING__thumbnailOpacity\t${settings.thumbnailOpacity}\n`;
    tsvContent += `__SETTING__thumbnailOffsetX\t${settings.thumbnailOffsetX}\n`;
    tsvContent += `__SETTING__thumbnailOffsetY\t${settings.thumbnailOffsetY}\n`;
    tsvContent += `__SETTING__thumbnailTitleFontSize\t${settings.thumbnailTitleFontSize}\n`;
    tsvContent += `__SETTING__thumbnailDateFontSize\t${settings.thumbnailDateFontSize}\n`;
    tsvContent += `__SETTING__thumbnailShowText\t${settings.thumbnailShowText}\n`;
    
    // Add header row
    tsvContent += 'position\tcompany\tlogo\turl\n';
    
    // Add data rows
    allCompanies.forEach(company => {
      tsvContent += `${company.position}\t${company.name}\t${company.logoUrl}\t${company.url || ''}\n`;
    });
    
    // Download file
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'data-export.tsv';
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success('Data and settings exported successfully');
  };

  // Helper function to convert Google Sheets URL to TSV export URL
  const convertGoogleSheetsUrl = (url: string): string | null => {
    try {
      // Match Google Sheets URL patterns
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

  // Process data from CSV/TSV content (shared logic)
  const processDataContent = (tsvContent: string, sourceName: string = "file") => {
    // Dismiss any loading toasts first
    toast.dismiss();
    
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
      delimiter: '\t', // Default to TSV
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
            logoUrl: row.logo, // Support for base64 images like data:image/png;base64,...
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

  const handleURLImport = async () => {
    const url = urlInput;
    if (!url) return;

    console.log("URL entered:", url);

    // Convert Google Sheets URL to TSV export URL
    const tsvUrl = convertGoogleSheetsUrl(url);
    
    if (!tsvUrl) {
      toast.error("Invalid Google Sheets URL. Please use a valid spreadsheet link.");
      return;
    }

    console.log("Fetching TSV from:", tsvUrl);
    toast.loading("Fetching data from Google Sheets...");

    // Close modal
    setIsUrlModalOpen(false);
    setUrlInput("");

    try {
      const response = await fetch(tsvUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      }

      const tsvContent = await response.text();
      console.log("TSV content fetched, length:", tsvContent.length);

      // Process the TSV content
      processDataContent(tsvContent, "Google Sheets");

    } catch (error) {
      console.error("Error fetching URL:", error);
      toast.dismiss();
      toast.error(`Failed to import from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("CSV/TSV file selected:", file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) {
        toast.error("Failed to read file");
        return;
      }

      // Check if file has metadata rows (__TITLE__, __DATE__, __SETTINGS__)
      const hasMetadata = content.startsWith('__TITLE__') || content.includes('\n__TITLE__') || content.startsWith('__SETTINGS__');

      if (hasMetadata) {
        // Use the processDataContent function which handles metadata
        processDataContent(content, "file");
      } else {
        // Fallback to old behavior: parse filename for title and date
        const fileName = file.name.replace(/\.(csv|tsv)$/i, ''); // Remove extension
        const parts = fileName.split(' - ');
        
        if (parts.length >= 2) {
          const titlePart = parts[0].trim();
          const datePart = parts.slice(1).join(' - ').trim(); // In case there are multiple dashes
          
          // Set title and date with bold and italic formatting
          setTitle(`<b><i>${titlePart}</i></b>`);
          setDate(`<b><i>${datePart}</i></b>`);
        }

        // Determine delimiter based on file extension
        const isTSV = file.name.toLowerCase().endsWith('.tsv');
        const delimiter = isTSV ? '\t' : ',';

        // Parse using Papa Parse
        Papa.parse<{ position: string; company: string; logo: string; url?: string }>(content, {
          header: true,
          skipEmptyLines: true,
          delimiter: delimiter,
          complete: (results) => {
            console.log("File parsed:", results);

            if (results.errors.length > 0) {
              console.error("File parsing errors:", results.errors);
              toast.error("Error parsing file");
              return;
            }

            if (results.data.length === 0) {
              toast.error("File is empty");
              return;
            }

            // Create companies from file
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
              toast.error("No valid data found in file. Make sure columns are: position, company, logo, url");
              return;
            }

            // Sort companies by position
            companies.sort((a, b) => a.position - b.position);

            // Distribute companies across two columns
            const col1Companies: Company[] = [];
            const col2Companies: Company[] = [];

            companies.forEach((company, index) => {
              if (index % 2 === 0) {
                col1Companies.push(company);
              } else {
                col2Companies.push(company);
              }
            });

            // Create two columns with distributed companies
            const newColumns: Column[] = [
              {
                id: `col-${Date.now()}-1`,
                companies: col1Companies,
              },
              {
                id: `col-${Date.now()}-2`,
                companies: col2Companies,
              },
            ];

            console.log("Setting columns:", newColumns);
            setColumns(newColumns);
            toast.success(`Loaded ${companies.length} companies`);
          },
          error: (error) => {
            console.error("File parsing error:", error);
            toast.error(`Failed to parse file: ${error.message}`);
          },
        });
      }
    };

    reader.onerror = () => {
      toast.error("Failed to read file");
    };

    reader.readAsText(file);

    // Reset input
    event.target.value = "";
  };

  return (
    <div className="flex items-end gap-4" data-mode="edit">
      {/* Tabs */}
      <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        {/* Tab Content */}
        {toolbarState.activeTab && (
          <div className="p-4">
            {toolbarState.activeTab === "cards" && (
              <div className="space-y-3">
                <SliderWithInput
                  label="Company Gap"
                  value={settings.companyGap}
                  onChange={(value) => setSettings({ ...settings, companyGap: value })}
                  min={0}
                  max={48}
                />
                <SliderWithInput
                  label="Company Font"
                  value={settings.companyFontSize}
                  onChange={(value) => setSettings({ ...settings, companyFontSize: value })}
                  min={8}
                  max={24}
                />
                <SliderWithInput
                  label="Logo Size"
                  value={settings.logoSize}
                  onChange={(value) => setSettings({ ...settings, logoSize: value })}
                  min={24}
                  max={120}
                />
                <SliderWithInput
                  label="Card Stroke"
                  value={settings.cardStrokeSize}
                  onChange={(value) => setSettings({ ...settings, cardStrokeSize: value })}
                  min={0}
                  max={8}
                />
                <SliderWithInput
                  label="Position Font"
                  value={settings.positionFontSize}
                  onChange={(value) => setSettings({ ...settings, positionFontSize: value })}
                  min={12}
                  max={48}
                />
                <SliderWithInput
                  label="Position Width"
                  value={settings.positionWidth}
                  onChange={(value) => setSettings({ ...settings, positionWidth: value })}
                  min={24}
                  max={120}
                />
                <SliderWithInput
                  label="Card Min Height"
                  value={settings.cardMinHeight}
                  onChange={(value) => setSettings({ ...settings, cardMinHeight: value })}
                  min={0}
                  max={200}
                />
              </div>
            )}

            {toolbarState.activeTab === "title" && (
              <div className="space-y-3">
                <SliderWithInput
                  label="Title Gap"
                  value={settings.titleGap}
                  onChange={(value) => setSettings({ ...settings, titleGap: value })}
                  min={0}
                  max={40}
                />
                <SliderWithInput
                  label="Title Font"
                  value={settings.titleFontSize}
                  onChange={(value) => setSettings({ ...settings, titleFontSize: value })}
                  min={20}
                  max={72}
                />
                <SliderWithInput
                  label="Subtitle Font"
                  value={settings.subtitleFontSize}
                  onChange={(value) => setSettings({ ...settings, subtitleFontSize: value })}
                  min={12}
                  max={60}
                />
                <SliderWithInput
                  label="Line Height"
                  value={settings.titleLineHeight}
                  onChange={(value) => setSettings({ ...settings, titleLineHeight: value })}
                  min={0.8}
                  max={2.5}
                  step={0.1}
                />
              </div>
            )}

            {toolbarState.activeTab === "layout" && (
              <div className="space-y-3">
                <SliderWithInput
                  label="Columns"
                  value={columns.length}
                  onChange={handleColumnCountChange}
                  min={1}
                  max={6}
                />
                <SliderWithInput
                  label="Column Gap"
                  value={settings.columnGap}
                  onChange={(value) => setSettings({ ...settings, columnGap: value, categoryGap: value })}
                  min={8}
                  max={48}
                />
                <SliderWithInput
                  label="Site Padding"
                  value={settings.sitePadding}
                  onChange={(value) => setSettings({ ...settings, sitePadding: value })}
                  min={0}
                  max={80}
                />
                <SliderWithInput
                  label="Header Gap"
                  value={settings.topSectionBottomPadding}
                  onChange={(value) => setSettings({ ...settings, topSectionBottomPadding: value })}
                  min={0}
                  max={80}
                />
              </div>
            )}

            {toolbarState.activeTab === "thumbnail" && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 pb-3 border-b border-gray-200">
                  <input
                    type="checkbox"
                    id="thumbnailShowText"
                    checked={settings.thumbnailShowText}
                    onChange={(e) => setSettings({ ...settings, thumbnailShowText: e.target.checked })}
                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                  />
                  <label htmlFor="thumbnailShowText" className="text-sm font-medium text-gray-700">
                    Show Title & Date
                  </label>
                </div>
                <SliderWithInput
                  label="Title Font Size"
                  value={settings.thumbnailTitleFontSize}
                  onChange={(value) => setSettings({ ...settings, thumbnailTitleFontSize: value })}
                  min={20}
                  max={200}
                />
                <SliderWithInput
                  label="Date Font Size"
                  value={settings.thumbnailDateFontSize}
                  onChange={(value) => setSettings({ ...settings, thumbnailDateFontSize: value })}
                  min={20}
                  max={200}
                />
                <SliderWithInput
                  label="Logo Size"
                  value={settings.thumbnailLogoSize}
                  onChange={(value) => setSettings({ ...settings, thumbnailLogoSize: value })}
                  min={20}
                  max={200}
                />
                <SliderWithInput
                  label="Logo Padding"
                  value={settings.thumbnailLogoPadding}
                  onChange={(value) => setSettings({ ...settings, thumbnailLogoPadding: value })}
                  min={0}
                  max={100}
                />
                <SliderWithInput
                  label="Row Padding"
                  value={settings.thumbnailRowPadding}
                  onChange={(value) => setSettings({ ...settings, thumbnailRowPadding: value })}
                  min={0}
                  max={150}
                />
                <SliderWithInput
                  label="Row Offset"
                  value={settings.thumbnailRowOffset}
                  onChange={(value) => setSettings({ ...settings, thumbnailRowOffset: value })}
                  min={-200}
                  max={200}
                />
                <SliderWithInput
                  label="X Offset"
                  value={settings.thumbnailOffsetX}
                  onChange={(value) => setSettings({ ...settings, thumbnailOffsetX: value })}
                  min={-600}
                  max={600}
                />
                <SliderWithInput
                  label="Y Offset"
                  value={settings.thumbnailOffsetY}
                  onChange={(value) => setSettings({ ...settings, thumbnailOffsetY: value })}
                  min={-400}
                  max={400}
                />
                <SliderWithInput
                  label="Rotation"
                  value={settings.thumbnailRotation}
                  onChange={(value) => setSettings({ ...settings, thumbnailRotation: value })}
                  min={-90}
                  max={90}
                  unit="°"
                />
                <SliderWithInput
                  label="Opacity"
                  value={settings.thumbnailOpacity}
                  onChange={(value) => setSettings({ ...settings, thumbnailOpacity: value })}
                  min={0}
                  max={100}
                  step={1}
                  unit="%"
                />
              </div>
            )}
          </div>
        )}

        {/* Tab Headers */}
        <div className="flex border-t border-gray-200 bg-white">
          <button
            onClick={() => setToolbarState({ isOpen: true, activeTab: toolbarState.activeTab === "cards" ? null : "cards" })}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-t-2 ${
              toolbarState.activeTab === "cards"
                ? "border-orange-500 text-orange-600 bg-orange-50"
                : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <Layers className="w-4 h-4" />
            Cards
          </button>
          <button
            onClick={() => setToolbarState({ isOpen: true, activeTab: toolbarState.activeTab === "title" ? null : "title" })}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-t-2 ${
              toolbarState.activeTab === "title"
                ? "border-orange-500 text-orange-600 bg-orange-50"
                : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <Heading className="w-4 h-4" />
            Title
          </button>
          <button
            onClick={() => setToolbarState({ isOpen: true, activeTab: toolbarState.activeTab === "layout" ? null : "layout" })}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-t-2 ${
              toolbarState.activeTab === "layout"
                ? "border-orange-500 text-orange-600 bg-orange-50"
                : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            Layout
          </button>
          <button
            onClick={() => setToolbarState({ isOpen: true, activeTab: toolbarState.activeTab === "thumbnail" ? null : "thumbnail" })}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-t-2 ${
              toolbarState.activeTab === "thumbnail"
                ? "border-orange-500 text-orange-600 bg-orange-50"
                : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
            }`}
          >
            <Image className="w-4 h-4" />
            Thumbnail
          </button>
        </div>
      </div>

      {/* Right side buttons */}
      <div className="flex gap-2">
        {/* Layout Toggle */}
        <div className="flex bg-white rounded-lg border border-gray-300 overflow-hidden">
          <button
            onClick={() => setLayout("list")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${ 
              layout === "list"
                ? "bg-orange-500 text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            List
          </button>
          <button
            onClick={() => setLayout("thumbnail")}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              layout === "thumbnail"
                ? "bg-orange-500 text-white"
                : "text-gray-700 hover:bg-gray-50"
            }`}
          >
            Thumbnail
          </button>
        </div>

        {/* Actions */}
        <label className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors">
          <Upload className="w-4 h-4" />
          <span className="font-medium">Import</span>
          <input
            type="file"
            accept=".csv,.tsv"
            onChange={handleCSVUpload}
            className="hidden"
          />
        </label>

        <button
          onClick={() => setIsUrlModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <Link className="w-4 h-4" />
          <span className="font-medium">URL</span>
        </button>

        <button
          onClick={handleExportData}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="font-medium">Export</span>
        </button>
      </div>

      {/* URL Import Modal */}
      {isUrlModalOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setIsUrlModalOpen(false)}
        >
          <div 
            className="bg-white p-8 rounded-xl shadow-2xl max-w-lg w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-2 text-gray-800">Import from Google Sheets</h2>
            <p className="text-sm text-gray-600 mb-6">Paste your Google Sheets URL below</p>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/..."
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg mb-6 focus:outline-none focus:border-orange-500 transition-colors"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleURLImport();
                } else if (e.key === "Escape") {
                  setIsUrlModalOpen(false);
                }
              }}
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsUrlModalOpen(false);
                  setUrlInput("");
                }}
                className="px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleURLImport}
                disabled={!urlInput.trim()}
                className="px-6 py-2.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}