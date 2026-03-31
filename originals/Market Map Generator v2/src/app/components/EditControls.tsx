import { Upload, Type, AlignVerticalSpaceAround, LayoutGrid, List, Layers, Heading, LayoutDashboard, Link, Code, Settings as SettingsIcon } from "lucide-react";
import Papa from "papaparse";
import { Column, Category, Company, Settings } from "../App";
import { Slider } from "./ui/slider";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
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
        <Label className="text-sm text-gray-700">{label}</Label>
        <input
          type="number"
          value={value}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          min={min}
          max={max}
          step={step}
          className="w-16 px-2 py-1 text-sm text-right border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
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
}: EditControlsProps) {
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [showEmbedDialog, setShowEmbedDialog] = useState(false);
  const [embedSheetId, setEmbedSheetId] = useState("");
  const [embedCode, setEmbedCode] = useState("");

  const handleAddColumn = () => {
    // Limit to max 8 columns
    if (columns.length >= 8) {
      toast.error("Maximum of 8 columns allowed");
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

    // Collect all categories from all columns
    columns.forEach((column) => {
      column.categories.forEach((category) => {
        // ALWAYS create an empty category row first (with stroke)
        const categoryRow = [
          category.name, // category
          '', // company (empty)
          category.logoUrl || '', // logo (if exists)
          category.customCompanyGap !== undefined ? String(category.customCompanyGap) : '', // url = Co Gap (if exists)
          category.stroke !== undefined ? String(category.stroke) : '', // stroke (if exists)
          '', // subcompanies (empty)
          category.customCategoryGap !== undefined ? String(category.customCategoryGap) : '', // columnGap (if exists)
        ];
        dataRows.push(categoryRow.join('\t'));

        // Then add all companies
        category.companies.forEach((company) => {
          const subcompaniesStr = company.subcompanies && company.subcompanies.length > 0
            ? company.subcompanies.map(sub => `${sub.name}|${sub.logoUrl}`).join(';')
            : '';

          const row = [
            category.name,
            company.name,
            company.logoUrl,
            company.url || '',
            category.stroke !== undefined ? String(category.stroke) : '',
            subcompaniesStr,
            category.customCategoryGap !== undefined ? String(category.customCategoryGap) : '',
          ];
          dataRows.push(row.join('\t'));
        });
      });
    });

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
        toast.success(`Loaded ${categories.length} categories with ${results.data.length} companies`);
      },
      error: (error) => {
        console.error("CSV parsing error:", error);
        toast.error(`Failed to parse CSV: ${error.message}`);
      },
    });
  };

  return (
    <div className="flex items-end gap-4">
      {/* Tabs */}
      <div className="flex-1 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
        {/* Tab Content */}
        {activeTab && (
          <div className="p-4">
            {activeTab === "cards" && (
              <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                <SliderWithInput
                  label="Card Gap"
                  value={settings.categoryCardGap}
                  onChange={(value) => setSettings({ ...settings, categoryCardGap: value })}
                  min={0}
                  max={48}
                  step={1}
                />

                <SliderWithInput
                  label="List Padding"
                  value={settings.listItemPadding}
                  onChange={(value) => setSettings({ ...settings, listItemPadding: value })}
                  min={0}
                  max={24}
                  step={1}
                />

                <SliderWithInput
                  label="Per Row"
                  value={settings.companiesPerRow}
                  onChange={(value) => setSettings({ ...settings, companiesPerRow: value })}
                  min={2}
                  max={6}
                  step={1}
                />

                <SliderWithInput
                  label="Card Stroke"
                  value={settings.cardStrokeSize}
                  onChange={(value) => setSettings({ ...settings, cardStrokeSize: value })}
                  min={0}
                  max={8}
                  step={1}
                />
              </div>
            )}

            {activeTab === "items" && (
              <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                <SliderWithInput
                  label="Company Font"
                  value={settings.companyFontSize}
                  onChange={(value) => setSettings({ ...settings, companyFontSize: value })}
                  min={8}
                  max={24}
                  step={1}
                />

                <SliderWithInput
                  label="Company Gap"
                  value={settings.companyGap}
                  onChange={(value) => setSettings({ ...settings, companyGap: value })}
                  min={0}
                  max={48}
                  step={1}
                />

                <SliderWithInput
                  label="Logo Size"
                  value={settings.logoSize}
                  onChange={(value) => setSettings({ ...settings, logoSize: value })}
                  min={8}
                  max={120}
                  step={1}
                />

                <SliderWithInput
                  label="Logo Gap"
                  value={settings.logoGap}
                  onChange={(value) => setSettings({ ...settings, logoGap: value })}
                  min={0}
                  max={24}
                  step={1}
                />
              </div>
            )}

            {activeTab === "category" && (
              <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                <SliderWithInput
                  label="Category Font"
                  value={settings.categoryFontSize}
                  onChange={(value) => setSettings({ ...settings, categoryFontSize: value })}
                  min={8}
                  max={24}
                  step={1}
                />

                <SliderWithInput
                  label="Category Logo Size"
                  value={settings.categoryLogoSize}
                  onChange={(value) => setSettings({ ...settings, categoryLogoSize: value })}
                  min={8}
                  max={64}
                  step={1}
                />

                <SliderWithInput
                  label="Category Logo Gap"
                  value={settings.categoryLogoGap}
                  onChange={(value) => setSettings({ ...settings, categoryLogoGap: value })}
                  min={0}
                  max={48}
                  step={1}
                />
              </div>
            )}

            {activeTab === "title" && (
              <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                <SliderWithInput
                  label="Title Gap"
                  value={settings.titleGap}
                  onChange={(value) => setSettings({ ...settings, titleGap: value })}
                  min={0}
                  max={40}
                  step={1}
                />

                <SliderWithInput
                  label="Title Font"
                  value={settings.titleFontSize}
                  onChange={(value) => setSettings({ ...settings, titleFontSize: value })}
                  min={20}
                  max={72}
                  step={1}
                />
              </div>
            )}

            {activeTab === "layout" && (
              <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                <SliderWithInput
                  label="Columns"
                  value={columns.length}
                  onChange={handleColumnCountChange}
                  min={1}
                  max={8}
                  step={1}
                />

                <SliderWithInput
                  label="Column Gap"
                  value={settings.columnGap}
                  onChange={(value) => setSettings({ ...settings, columnGap: value, categoryGap: value })}
                  min={8}
                  max={48}
                  step={1}
                />

                <SliderWithInput
                  label="Site Padding"
                  value={settings.sitePadding}
                  onChange={(value) => setSettings({ ...settings, sitePadding: value })}
                  min={0}
                  max={80}
                  step={1}
                />

                <SliderWithInput
                  label="Header Gap"
                  value={settings.topSectionBottomPadding}
                  onChange={(value) => setSettings({ ...settings, topSectionBottomPadding: value })}
                  min={0}
                  max={80}
                  step={1}
                />
              </div>
            )}

            {activeTab === "settings" && (
              <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                <div className="flex items-center justify-between gap-3 px-4 py-2 bg-white rounded-lg border border-gray-200">
                  <Label className="text-sm text-gray-700">Show Presented By Logo</Label>
                  <Switch
                    checked={settings.showPresentedBy}
                    onCheckedChange={(checked) => setSettings({ ...settings, showPresentedBy: checked })}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab Headers */}
        <div className="flex justify-between items-center border-t border-gray-200 bg-white">
          <div className="flex">
            <button
              onClick={() => setActiveTab(activeTab === "cards" ? null : "cards")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-t-2 ${
                activeTab === "cards"
                  ? "border-orange-500 text-orange-600 bg-orange-50"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <Layers className="w-4 h-4" />
              Cards
            </button>
            <button
              onClick={() => setActiveTab(activeTab === "items" ? null : "items")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-t-2 ${
                activeTab === "items"
                  ? "border-orange-500 text-orange-600 bg-orange-50"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <List className="w-4 h-4" />
              Items
            </button>
            <button
              onClick={() => setActiveTab(activeTab === "category" ? null : "category")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-t-2 ${
                activeTab === "category"
                  ? "border-orange-500 text-orange-600 bg-orange-50"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <Type className="w-4 h-4" />
              Category
            </button>
            <button
              onClick={() => setActiveTab(activeTab === "title" ? null : "title")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-t-2 ${
                activeTab === "title"
                  ? "border-orange-500 text-orange-600 bg-orange-50"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <Heading className="w-4 h-4" />
              Title
            </button>
            <button
              onClick={() => setActiveTab(activeTab === "layout" ? null : "layout")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-t-2 ${
                activeTab === "layout"
                  ? "border-orange-500 text-orange-600 bg-orange-50"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              Layout
            </button>
            <button
              onClick={() => setActiveTab(activeTab === "settings" ? null : "settings")}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-t-2 ${
                activeTab === "settings"
                  ? "border-orange-500 text-orange-600 bg-orange-50"
                  : "border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-50"
              }`}
            >
              <SettingsIcon className="w-4 h-4" />
              Settings
            </button>
          </div>
        </div>
      </div>

      {/* Right side buttons */}
      <div className="flex gap-2">
        {/* Actions */}
        <label className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 cursor-pointer transition-colors">
          <Upload className="w-4 h-4" />
          <span className="font-medium">Import CSV / TSV</span>
          <input
            type="file"
            accept=".csv, .tsv"
            onChange={handleCSVUpload}
            className="hidden"
          />
        </label>

        <button
          onClick={() => setShowUrlDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <Link className="w-4 h-4" />
          <span className="font-medium">Import from URL</span>
        </button>

        <button
          onClick={() => setShowEmbedDialog(true)}
          className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
        >
          <Code className="w-4 h-4" />
          <span className="font-medium">Embed</span>
        </button>
      </div>

      {/* URL Import Dialog */}
      {showUrlDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowUrlDialog(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Import from URL</h3>
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUrlImport()}
              placeholder="Paste TSV URL or Google Sheets URL"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 mb-4"
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowUrlDialog(false);
                  setUrlInput("");
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUrlImport}
                className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embed Dialog */}
      {showEmbedDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEmbedDialog(false)}>
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Generate Embed Code</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Sheets ID or URL
              </label>
              <input
                type="text"
                value={embedSheetId}
                onChange={(e) => setEmbedSheetId(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleGenerateEmbed()}
                placeholder="e.g., 1cDIIRi5sVFW7X0E4j2l8mPHaBzkh0tw6DvbhQBcSM68"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                autoFocus
              />
              <p className="text-xs text-gray-500 mt-1">
                Enter the Google Sheets ID or full URL. The embed will include responsive mode.
              </p>
            </div>

            <button
              onClick={handleGenerateEmbed}
              className="w-full px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium transition-colors mb-4"
            >
              Generate Embed Code
            </button>

            {embedCode && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Embed Code
                </label>
                <div className="relative">
                  <textarea
                    value={embedCode}
                    readOnly
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
                  />
                  <button
                    onClick={handleCopyEmbed}
                    className="absolute top-2 right-2 px-3 py-1 bg-orange-500 hover:bg-orange-600 text-white text-sm rounded transition-colors"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowEmbedDialog(false);
                  setEmbedSheetId("");
                  setEmbedCode("");
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}