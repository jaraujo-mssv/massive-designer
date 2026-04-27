import { Upload, Type, List, Layers, Heading, LayoutDashboard, Link, Code, Settings as SettingsIcon, Wand2, Sun, Moon } from "lucide-react";
import Papa from "papaparse";
import { Column, Category, Company, Settings } from "../App";
import { Slider } from "@/shared/components/ui/slider";
import { Label } from "@/shared/components/ui/label";
import { Switch } from "@/shared/components/ui/switch";
import { toast } from "sonner";
import { useState } from "react";
import { convertToGoogleSheetsTsvUrl } from "../utils/googleSheets";

interface SliderWithInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
}

function SliderWithInput({ label, value, onChange, min, max, step = 1 }: SliderWithInputProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (!isNaN(newValue)) {
      // Clamp value between min and max
      const clampedValue = Math.min(Math.max(newValue, min), max);
      onChange(clampedValue);
    }
  };

  const handleInputBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const newValue = parseFloat(e.target.value);
    if (isNaN(newValue) || newValue < min) {
      onChange(min);
    } else if (newValue > max) {
      onChange(max);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-text-dim uppercase tracking-wide">{label}</Label>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          min={min}
          max={max}
          step={step}
          className="w-16 px-2 py-1 text-sm text-left border border-border-subtle rounded-md bg-surface text-text-primary focus:outline-none focus:border-brand"
        />
      </div>
      <Slider
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
        className="w-full"
      />
    </div>
  );
}

interface EditControlsProps {
  settings: Settings;
  setSettings: React.Dispatch<React.SetStateAction<Settings>>;
  columns: Column[];
  setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
  setTitle?: (title: string) => void;
  setDate?: (date: string) => void;
  title: string;
  date: string;
  activeTab: "cards" | "items" | "category" | "title" | "layout" | "settings" | null;
  setActiveTab: React.Dispatch<React.SetStateAction<"cards" | "items" | "category" | "title" | "layout" | "settings" | null>>;
  setMode?: (mode: "edit" | "preview") => void;
  onAutoAdjust?: () => void;
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
  activeTab,
  setActiveTab,
  setMode,
  onAutoAdjust,
}: EditControlsProps) {
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [embedSheetId, setEmbedSheetId] = useState("");
  const [embedCode, setEmbedCode] = useState("");

  const handleAddColumn = () => {
    // Limit to max 5 columns
    if (columns.length >= 5) {
      toast.error("Maximum of 5 columns allowed");
      return;
    }
    
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      categories: [],
    };
    setColumns([...columns, newColumn]);
  };

  const handleColumnCountChange = (newCount: number) => {
    const currentCount = columns.length;
    
    if (newCount === currentCount) return;
    
    if (newCount > currentCount) {
      // Add empty columns
      const newColumns = [...columns];
      for (let i = currentCount; i < newCount; i++) {
        newColumns.push({
          id: `col-${Date.now()}-${i}`,
          categories: [],
        });
      }
      setColumns(newColumns);
    } else {
      // Reduce columns and redistribute categories
      const allCategories: Category[] = [];
      columns.forEach(col => {
        allCategories.push(...col.categories);
      });
      
      // Create new columns with reduced count
      const newColumns: Column[] = Array.from({ length: newCount }, (_, i) => ({
        id: columns[i]?.id || `col-${Date.now()}-${i}`,
        categories: [],
      }));
      
      // Distribute categories evenly (round-robin)
      allCategories.forEach((category, index) => {
        const columnIndex = index % newCount;
        newColumns[columnIndex].categories.push(category);
      });
      
      setColumns(newColumns);
    }
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log("File selected:", file.name);

    // Determine delimiter based on file extension
    const delimiter = file.name.endsWith('.tsv') ? '\t' : ',';

    // Read file as text first to check for metadata
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) return;

      processTextData(text, delimiter, file.name);
    };
    
    reader.readAsText(file);
  };

  const handleUrlImport = () => {
    if (!urlInput.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    // Convert Google Sheets URL if needed
    const tsvUrl = convertToGoogleSheetsTsvUrl(urlInput.trim());
    
    console.log("Original URL:", urlInput.trim());
    console.log("Converted TSV URL:", tsvUrl);

    toast.promise(
      fetch(tsvUrl)
        .then(response => {
          console.log("Response status:", response.status);
          console.log("Response headers:", response.headers);
          
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
            throw new Error("Could not access the file. Make sure the Google Sheet is publicly accessible or shared with 'Anyone with the link can view'");
          }
          
          if (!csvText.trim()) {
            throw new Error("The file is empty");
          }
          
          processTextData(csvText, '\t', ''); // Always use tab delimiter for URL imports
          setShowUrlDialog(false);
          setUrlInput("");
        }),
      {
        loading: 'Loading file from URL...',
        success: 'File loaded successfully!',
        error: (err) => `Failed to load file: ${err.message}`,
      }
    );
  };

  const handleGenerateEmbed = () => {
    if (!embedSheetId.trim()) {
      toast.error("Please enter a Google Sheets ID");
      return;
    }

    // Convert to Google Sheets ID if a URL was provided
    const sheetUrl = convertToGoogleSheetsTsvUrl(embedSheetId.trim());
    // Extract just the ID from the converted URL
    const idMatch = sheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const finalId = idMatch ? idMatch[1] : embedSheetId.trim();

    const currentUrl = window.location.origin + window.location.pathname;
    const embedUrl = `${currentUrl}?f=${finalId}&r=1`;
    const iframeCode = `<iframe src="${embedUrl}" width="100%" height="800" frameborder="0"></iframe>`;
    
    setEmbedCode(iframeCode);
    toast.success("Embed code generated!");
  };

  const handleCopyEmbed = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success("Embed code copied to clipboard!");
  };

  const handleExport = () => {
    // Prepare metadata rows
    const metadataRows = [
      `__TITLE__\t${title}`,
      `__DATE__\t${date}`,
      `__COLUMNS__\t${columns.length}`,
    ];

    // Export all settings
    Object.entries(settings).forEach(([key, value]) => {
      metadataRows.push(`__SETTING__${key}\t${value}`);
    });

    // Prepare data rows with header
    const headers = ['category', 'company', 'logo', 'url', 'stroke', 'subcompanies', 'columnGap'];
    const dataRows = [headers.join('\t')];

    // Collect all categories row-by-row (interleaved) so round-robin re-import restores the same layout
    const maxRows = Math.max(0, ...columns.map(col => col.categories.length));
    for (let row = 0; row < maxRows; row++) {
      columns.forEach((column) => {
        const category = column.categories[row];
        if (!category) return;
        dataRows.push([
          category.name,
          '',
          category.logoUrl || '',
          category.customCompanyGap !== undefined ? String(category.customCompanyGap) : '',
          category.stroke !== undefined ? String(category.stroke) : '',
          '',
          category.customCategoryGap !== undefined ? String(category.customCategoryGap) : '',
        ].join('\t'));
        category.companies.forEach((company) => {
          const subcompaniesStr = company.subcompanies && company.subcompanies.length > 0
            ? company.subcompanies.map(sub => `${sub.name}|${sub.logoUrl}`).join(';')
            : '';
          dataRows.push([
            category.name,
            company.name,
            company.logoUrl,
            company.url || '',
            category.stroke !== undefined ? String(category.stroke) : '',
            subcompaniesStr,
            category.customCategoryGap !== undefined ? String(category.customCategoryGap) : '',
          ].join('\t'));
        });
      });
    }

    // Combine metadata and data
    const tsvContent = [...metadataRows, '', ...dataRows].join('\n');

    // Create and download the file
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `market-map-${Date.now()}.tsv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Market map exported successfully');
  };

  const processTextData = (text: string, delimiter: string, fileName: string) => {
    // Split into lines to process metadata
    const lines = text.split('\n');
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
    
    // Process metadata if it exists
    let loadedTitle: string | null = null;
    let loadedDate: string | null = null;
    let columnCount: number | null = null;
    const loadedSettings: Partial<Settings> = {};
    
    if (metadataRows.length > 0) {
      metadataRows.forEach(row => {
        const parts = row.split(delimiter);
        if (parts[0] === '__TITLE__' && parts[1]) {
          loadedTitle = parts[1];
        } else if (parts[0] === '__DATE__' && parts[1]) {
          loadedDate = parts[1];
        } else if (parts[0] === '__COLUMNS__' && parts[1]) {
          columnCount = parseInt(parts[1]) || null;
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
      if (loadedTitle && setTitle) setTitle(loadedTitle);
      if (loadedDate && setDate) setDate(loadedDate);
      if (Object.keys(loadedSettings).length > 0) {
        setSettings({ ...settings, ...loadedSettings });
      }
    } else {
      // No metadata found, try to extract from filename
      const fileNameWithoutExt = fileName.replace(/\.(csv|tsv)$/i, '');
      const parts = fileNameWithoutExt.split(' - ');
      
      if (parts.length >= 2 && setTitle && setDate) {
        const mainTitle = parts[0].trim();
        const datePart = parts.slice(1).join(' - ').trim();
        
        setTitle(mainTitle);
        setDate(datePart);
        console.log("Extracted title:", mainTitle, "date:", datePart);
      }
    }

    // Parse the data rows
    const dataText = dataRows.join('\n');
    Papa.parse<{ category: string; company: string; logo: string; url?: string; stroke?: string; subcompanies?: string; columnGap?: string }>(dataText, {
      header: true,
      skipEmptyLines: true,
      delimiter: delimiter,
      complete: (results) => {
        console.log("CSV parsed:", results);

        if (results.errors.length > 0) {
          console.error("CSV parsing errors:", results.errors);
          toast.error("Error parsing CSV file");
          return;
        }

        if (results.data.length === 0) {
          toast.error("CSV file is empty");
          return;
        }

        // Group companies by category AND stroke number
        const categoryMap = new Map<string, { categoryName: string; companies: Company[]; stroke?: number; logoUrl?: string; customCategoryGap?: number; customCompanyGap?: number }>();

        results.data.forEach((row, index) => {
          console.log(`Row ${index}:`, row);
          
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
            
            console.log(`Category row: ${row.category}, logoUrl: ${row.logo || 'none'}, stroke: ${stroke}, customCompanyGap: ${customCompanyGap}, customCategoryGap: ${customCategoryGap}`);
            return;
          }
          
          // Regular company row
          if (!row.category || !row.company || !row.logo) {
            console.warn(`Skipping row ${index} - missing required fields:`, row);
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
                const subcompany = { 
                  id: `sub-${Date.now()}-${Math.random()}-${idx}`,
                  name: subName?.trim() || '', 
                  logoUrl: subLogo?.trim() || '' 
                };
                console.log(`Parsed subcompany ${idx}:`, subcompany);
                return subcompany;
              }).filter(sub => {
                const isValid = sub.name && sub.logoUrl;
                if (!isValid) {
                  console.log('Filtering out invalid subcompany:', sub);
                }
                return isValid;
              }) : 
              undefined,
          };
          console.log(`Company "${row.company}" has ${company.subcompanies?.length || 0} subcompanies:`, company.subcompanies);

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

        if (categoryMap.size === 0) {
          toast.error("No valid data found in CSV. Make sure columns are: category, company, logo");
          return;
        }

        // Create categories
        const categories: Category[] = Array.from(categoryMap.entries()).map(
          ([mapKey, data]) => {
            const category = {
              id: `cat-${Date.now()}-${Math.random()}`,
              name: data.categoryName,
              companies: data.companies,
              stroke: data.stroke,
              logoUrl: data.logoUrl,
              customCategoryGap: data.customCategoryGap,
              customCompanyGap: data.customCompanyGap,
            };
            console.log(`Creating category: ${data.categoryName}, stroke: ${data.stroke}, mapKey: ${mapKey}`);
            return category;
          }
        );

        console.log("Created categories:", categories);

        // Determine number of columns (use metadata if available, otherwise current column count)
        const numColumns = columnCount || columns.length;
        const newColumns: Column[] = Array.from({ length: numColumns }, (_, i) => ({
          id: columns[i]?.id || `col-${Date.now()}-${i}`,
          categories: [],
        }));

        // Distribute categories evenly (round-robin)
        categories.forEach((category, index) => {
          const columnIndex = index % numColumns;
          newColumns[columnIndex].categories.push(category);
        });

        console.log("Setting columns:", newColumns);
        setColumns(newColumns);
        setMode?.("preview");
        toast.success(`Loaded ${categories.length} categories with ${results.data.length} companies`);
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        toast.error(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  const tabs = [
    { id: "layout" as const, label: "Layout", Icon: LayoutDashboard },
    { id: "cards" as const, label: "Sections", Icon: Layers },
    { id: "category" as const, label: "Section Header", Icon: Type },
    { id: "items" as const, label: "Companies", Icon: List },
    { id: "title" as const, label: "Title", Icon: Heading },
    { id: "settings" as const, label: "Settings", Icon: SettingsIcon },
  ];

  const inputClass = "w-full px-3 py-2 border border-border-subtle rounded-lg text-sm bg-surface text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand";

  return (
    <div className="flex flex-col">
      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-1 p-3 border-b border-border-subtle">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(activeTab === id ? null : id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
              activeTab === id
                ? "bg-brand text-white"
                : "text-text-dim hover:text-text-primary hover:bg-surface"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab && (
        <div className="p-4 space-y-4 border-b border-border-subtle">
          {activeTab === "cards" && (
            <>
              <SliderWithInput label="Section Gap" value={settings.categoryCardGap} onChange={(v) => setSettings({ ...settings, categoryCardGap: v })} min={0} max={48} />
              <SliderWithInput label="Card Padding" value={settings.listItemPadding} onChange={(v) => setSettings({ ...settings, listItemPadding: v })} min={0} max={24} />
              <SliderWithInput label="Per Row" value={settings.companiesPerRow} onChange={(v) => setSettings({ ...settings, companiesPerRow: v })} min={2} max={6} />
              <SliderWithInput label="Border Width" value={settings.cardStrokeSize} onChange={(v) => setSettings({ ...settings, cardStrokeSize: v })} min={0} max={8} />
            </>
          )}
          {activeTab === "items" && (
            <>
              <SliderWithInput label="Font Size" value={settings.companyFontSize} onChange={(v) => setSettings({ ...settings, companyFontSize: v })} min={8} max={24} />
              <SliderWithInput label="Item Gap" value={settings.companyGap} onChange={(v) => setSettings({ ...settings, companyGap: v })} min={0} max={48} />
              <SliderWithInput label="Logo Size" value={settings.logoSize} onChange={(v) => setSettings({ ...settings, logoSize: v })} min={8} max={120} />
              <SliderWithInput label="Logo Gap" value={settings.logoGap} onChange={(v) => setSettings({ ...settings, logoGap: v })} min={0} max={24} />
            </>
          )}
          {activeTab === "category" && (
            <>
              <SliderWithInput label="Font Size" value={settings.categoryFontSize} onChange={(v) => setSettings({ ...settings, categoryFontSize: v })} min={8} max={24} />
              <SliderWithInput label="Logo Size" value={settings.categoryLogoSize} onChange={(v) => setSettings({ ...settings, categoryLogoSize: v })} min={8} max={64} />
              <SliderWithInput label="Logo Gap" value={settings.categoryLogoGap} onChange={(v) => setSettings({ ...settings, categoryLogoGap: v })} min={0} max={48} />
            </>
          )}
          {activeTab === "title" && (
            <>
              <SliderWithInput label="Title Gap" value={settings.titleGap} onChange={(v) => setSettings({ ...settings, titleGap: v })} min={0} max={40} />
              <SliderWithInput label="Title Font" value={settings.titleFontSize} onChange={(v) => setSettings({ ...settings, titleFontSize: v })} min={20} max={72} />
              <SliderWithInput label="Subtitle Font" value={settings.dateFontSize} onChange={(v) => setSettings({ ...settings, dateFontSize: v })} min={20} max={72} />
            </>
          )}
          {activeTab === "layout" && (
            <>
              <SliderWithInput label="Columns" value={columns.length} onChange={handleColumnCountChange} min={1} max={5} />
              <SliderWithInput label="Column Gap" value={settings.columnGap} onChange={(v) => setSettings({ ...settings, columnGap: v, categoryGap: v })} min={8} max={48} />
              <SliderWithInput label="Outer Padding" value={settings.sitePadding} onChange={(v) => setSettings({ ...settings, sitePadding: v })} min={0} max={80} />
              <SliderWithInput label="Content Gap" value={settings.topSectionBottomPadding} onChange={(v) => setSettings({ ...settings, topSectionBottomPadding: v })} min={0} max={80} />
              {onAutoAdjust && (
                <button
                  onClick={onAutoAdjust}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg hover:opacity-90 font-medium text-sm transition-opacity"
                >
                  <Wand2 className="w-4 h-4" />
                  Auto-Adjust Columns
                </button>
              )}
            </>
          )}
          {activeTab === "settings" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-border-subtle">
                <Label className="text-sm text-text-primary">Show Presented By Logo</Label>
                <Switch
                  checked={settings.showPresentedBy}
                  onCheckedChange={(checked) => setSettings({ ...settings, showPresentedBy: checked })}
                />
              </div>
              <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-border-subtle">
                <Label className="text-sm text-text-primary flex items-center gap-2">
                  {settings.canvasTheme === 'light' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                  Canvas Theme
                </Label>
                <Switch
                  checked={settings.canvasTheme === 'light'}
                  onCheckedChange={(checked) => setSettings({ ...settings, canvasTheme: checked ? 'light' : 'dark' })}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Import Section */}
      <div className="p-4 space-y-2">
        <h3 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3">Import</h3>
        <label className="w-full flex items-center gap-2 px-4 py-2.5 bg-surface-2 border border-border-subtle text-text-primary rounded-lg hover:border-brand hover:text-brand-light cursor-pointer text-sm transition-colors">
          <Upload className="w-4 h-4" />
          Import CSV / TSV
          <input type="file" accept=".csv, .tsv" onChange={handleCSVUpload} className="hidden" />
        </label>
        <button
          onClick={() => setShowUrlDialog(true)}
          className="w-full flex items-center gap-2 px-4 py-2.5 bg-surface-2 border border-border-subtle text-text-primary rounded-lg hover:border-brand hover:text-brand-light text-sm transition-colors"
        >
          <Link className="w-4 h-4" />
          Import from URL
        </button>
        <button
          onClick={() => setShowEmbedDialog(true)}
          className="w-full flex items-center gap-2 px-4 py-2.5 bg-surface-2 border border-border-subtle text-text-primary rounded-lg hover:border-brand hover:text-brand-light text-sm transition-colors"
        >
          <Code className="w-4 h-4" />
          Generate Embed Code
        </button>
      </div>

      {/* URL Import Dialog */}
      {showUrlDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowUrlDialog(false)}>
          <div className="bg-surface border border-border-subtle rounded-xl shadow-2xl p-6 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-text-primary mb-4">Import from URL</h3>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
              placeholder="Paste TSV URL or Google Sheets URL"
              className={`${inputClass} mb-4`}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowUrlDialog(false); setUrlInput(""); }} className="px-4 py-2 text-sm text-text-dim hover:text-text-primary rounded-lg transition-colors">
                Cancel
              </button>
              <button onClick={handleUrlImport} className="px-4 py-2 bg-brand text-white text-sm rounded-lg hover:opacity-90 font-medium transition-opacity">
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Dialog */}
      {showEmbedDialog && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50" onClick={() => setShowEmbedDialog(false)}>
          <div className="bg-surface border border-border-subtle rounded-xl shadow-2xl p-6 w-full max-w-2xl mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-text-primary mb-4">Generate Embed Code</h3>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-text-dim uppercase tracking-widest mb-2">Google Sheets ID or URL</label>
              <input
                type="text"
                value={embedSheetId}
                onChange={(e) => setEmbedSheetId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateEmbed()}
                placeholder="e.g., 1cDIIRi5sVFW7X0E4j2l8mPHaBzkh0tw6DvbhQBcSM68"
                className={inputClass}
                autoFocus
              />
              <p className="text-xs text-text-dim mt-1">Enter the Google Sheets ID or full URL. The embed will include responsive mode.</p>
            </div>
            <button onClick={handleGenerateEmbed} className="w-full px-4 py-2.5 bg-brand hover:opacity-90 text-white rounded-lg font-medium transition-opacity mb-4 text-sm">
              Generate Embed Code
            </button>
            {embedCode && (
              <div className="mt-4">
                <label className="block text-xs font-semibold text-text-dim uppercase tracking-widest mb-2">Embed Code</label>
                <div className="relative">
                  <textarea value={embedCode} readOnly rows={3} className={`${inputClass} font-mono resize-none`} />
                  <button onClick={handleCopyEmbed} className="absolute top-2 right-2 px-3 py-1 bg-brand hover:opacity-90 text-white text-xs rounded transition-opacity">
                    Copy
                  </button>
                </div>
              </div>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <button onClick={() => { setShowEmbedDialog(false); setEmbedSheetId(""); setEmbedCode(""); }} className="px-4 py-2 text-sm text-text-dim hover:text-text-primary rounded-lg transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}