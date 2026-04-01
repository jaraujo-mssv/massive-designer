import { useState } from "react";
import { Upload, Layers, Heading, LayoutDashboard, Image, Link, Settings as SettingsIcon } from "lucide-react";
import Papa from "papaparse";
import { toast } from "sonner";
import { Column, Settings, Company } from "../App";
import { SliderWithInput } from "./SliderWithInput";
import { Switch } from "@/shared/components/ui/switch";
import { Label } from "@/shared/components/ui/label";
import { convertToGoogleSheetsTsvUrl } from "../utils/googleSheets";

interface EditControlsProps {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  columns: Column[];
  setColumns: (columns: Column[]) => void;
  setTitle: (title: string) => void;
  setDate: (date: string) => void;
  title: string;
  date: string;
  activeTab: "cards" | "title" | "layout" | "thumbnail" | "settings" | null;
  setActiveTab: React.Dispatch<React.SetStateAction<"cards" | "title" | "layout" | "thumbnail" | "settings" | null>>;
  layout: "list" | "thumbnail";
  setLayout: (layout: "list" | "thumbnail") => void;
  setMode?: (mode: "edit" | "preview") => void;
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
  layout,
  setLayout,
  setMode,
}: EditControlsProps) {
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const handleColumnCountChange = (newCount: number) => {
    const allCompanies: Company[] = [];
    columns.forEach(col => allCompanies.push(...col.companies));
    allCompanies.sort((a, b) => a.position - b.position);

    const newColumns: Column[] = [];
    for (let i = 0; i < newCount; i++) {
      newColumns.push({ id: `col-${Date.now()}-${i}`, companies: [] });
    }
    allCompanies.forEach((company, index) => {
      newColumns[index % newCount].companies.push(company);
    });
    setColumns(newColumns);
  };

  const processDataContent = (tsvContent: string, sourceName: string = "file") => {
    toast.dismiss();

    const lines = tsvContent.split('\n');
    let titleValue = "";
    let dateValue = "";
    let columnsCount: number | null = null;
    const parsedSettings: Partial<Settings> = {};
    let dataStartIndex = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (line.startsWith('__TITLE__')) {
        titleValue = line.split('\t')[1]?.trim() || "";
        dataStartIndex = i + 1;
      } else if (line.startsWith('__DATE__')) {
        dateValue = line.split('\t')[1]?.trim() || "";
        dataStartIndex = i + 1;
      } else if (line.startsWith('__COLUMNS__')) {
        columnsCount = parseInt(line.split('\t')[1]?.trim() || "2", 10);
        dataStartIndex = i + 1;
      } else if (line.startsWith('__SETTING__')) {
        const parts = line.split('\t');
        const settingName = parts[0].replace('__SETTING__', '');
        const settingValue = parts[1]?.trim() || "";
        if (settingValue.toLowerCase() === 'true') {
          parsedSettings[settingName as keyof Settings] = true as any;
        } else if (settingValue.toLowerCase() === 'false') {
          parsedSettings[settingName as keyof Settings] = false as any;
        } else if (!isNaN(Number(settingValue))) {
          parsedSettings[settingName as keyof Settings] = parseFloat(settingValue) as any;
        } else {
          parsedSettings[settingName as keyof Settings] = settingValue as any;
        }
        dataStartIndex = i + 1;
      } else if (line.includes('position') && line.includes('company')) {
        break;
      }
    }

    if (titleValue) setTitle(`<b>${titleValue}</b>`);
    if (dateValue) setDate(`<b>${dateValue}</b>`);
    if (Object.keys(parsedSettings).length > 0) {
      setSettings({ ...settings, ...parsedSettings });
    }

    const contentToProcess = lines.slice(dataStartIndex).join('\n');
    Papa.parse<{ position: string; company: string; logo: string; url?: string }>(contentToProcess, {
      header: true,
      skipEmptyLines: true,
      delimiter: '\t',
      complete: (results) => {
        if (results.errors.length > 0) { toast.error("Error parsing data"); return; }
        if (results.data.length === 0) { toast.error("Data is empty"); return; }

        const companies: Company[] = [];
        results.data.forEach((row, index) => {
          if (!row.position || !row.company || !row.logo) {
            console.warn(`Skipping row ${index} - missing required fields:`, row);
            return;
          }
          companies.push({
            id: `company-${Date.now()}-${Math.random()}`,
            position: parseInt(row.position, 10),
            name: row.company,
            logoUrl: row.logo,
            url: row.url,
          });
        });

        if (companies.length === 0) {
          toast.error("No valid data found. Make sure columns are: position, company, logo, url");
          return;
        }

        companies.sort((a, b) => a.position - b.position);
        const numColumns = columnsCount || 2;
        const newColumns: Column[] = [];
        for (let i = 0; i < numColumns; i++) {
          newColumns.push({ id: `col-${Date.now()}-${i}`, companies: [] });
        }
        companies.forEach((company, index) => {
          newColumns[index % numColumns].companies.push(company);
        });
        setColumns(newColumns);
        setMode?.("preview");

        const settingsImported = Object.keys(parsedSettings).length > 0;
        toast.success(
          settingsImported
            ? `Loaded ${companies.length} companies and ${Object.keys(parsedSettings).length} settings from ${sourceName}`
            : `Loaded ${companies.length} companies from ${sourceName}`
        );
      },
      error: (error) => toast.error(`Failed to parse data: ${error.message}`),
    });
  };

  const handleCSVUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) { toast.error("Failed to read file"); return; }

      const hasMetadata = content.startsWith('__TITLE__') || content.includes('\n__TITLE__') || content.startsWith('__SETTINGS__');
      if (hasMetadata) {
        processDataContent(content, "file");
      } else {
        // Fallback: parse filename for title/date
        const fileName = file.name.replace(/\.(csv|tsv)$/i, '');
        const parts = fileName.split(' - ');
        if (parts.length >= 2) {
          setTitle(`<b><i>${parts[0].trim()}</i></b>`);
          setDate(`<b><i>${parts.slice(1).join(' - ').trim()}</i></b>`);
        }

        const delimiter = file.name.toLowerCase().endsWith('.tsv') ? '\t' : ',';
        Papa.parse<{ position: string; company: string; logo: string; url?: string }>(content, {
          header: true,
          skipEmptyLines: true,
          delimiter,
          complete: (results) => {
            if (results.errors.length > 0) { toast.error("Error parsing file"); return; }
            if (results.data.length === 0) { toast.error("File is empty"); return; }

            const companies: Company[] = [];
            results.data.forEach((row, index) => {
              if (!row.position || !row.company || !row.logo) {
                console.warn(`Skipping row ${index}:`, row);
                return;
              }
              companies.push({
                id: `company-${Date.now()}-${Math.random()}`,
                position: parseInt(row.position, 10),
                name: row.company,
                logoUrl: row.logo,
                url: row.url,
              });
            });
            if (companies.length === 0) { toast.error("No valid data found."); return; }
            companies.sort((a, b) => a.position - b.position);

            const col1: Company[] = [];
            const col2: Company[] = [];
            companies.forEach((c, i) => (i % 2 === 0 ? col1 : col2).push(c));
            setColumns([
              { id: `col-${Date.now()}-1`, companies: col1 },
              { id: `col-${Date.now()}-2`, companies: col2 },
            ]);
            toast.success(`Loaded ${companies.length} companies`);
          },
          error: (error) => toast.error(`Failed to parse file: ${error.message}`),
        });
      }
    };
    reader.onerror = () => toast.error("Failed to read file");
    reader.readAsText(file);
    event.target.value = "";
  };

  const handleUrlImport = async () => {
    if (!urlInput.trim()) { toast.error("Please enter a URL"); return; }

    const tsvUrl = convertToGoogleSheetsTsvUrl(urlInput.trim());
    setShowUrlDialog(false);
    setUrlInput("");
    toast.loading("Fetching data from Google Sheets...");

    try {
      const response = await fetch(tsvUrl);
      if (!response.ok) throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
      const tsvContent = await response.text();
      processDataContent(tsvContent, "Google Sheets");
    } catch (error) {
      toast.dismiss();
      toast.error(`Failed to import from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const tabs = [
    { id: "cards" as const, label: "Cards", Icon: Layers },
    { id: "title" as const, label: "Title", Icon: Heading },
    { id: "layout" as const, label: "Layout", Icon: LayoutDashboard },
    { id: "thumbnail" as const, label: "Thumbnail", Icon: Image },
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
              <SliderWithInput label="Company Gap" value={settings.companyGap} onChange={(v) => setSettings({ ...settings, companyGap: v })} min={0} max={48} />
              <SliderWithInput label="Company Font" value={settings.companyFontSize} onChange={(v) => setSettings({ ...settings, companyFontSize: v })} min={8} max={24} />
              <SliderWithInput label="Logo Size" value={settings.logoSize} onChange={(v) => setSettings({ ...settings, logoSize: v })} min={24} max={120} />
              <SliderWithInput label="Card Stroke" value={settings.cardStrokeSize} onChange={(v) => setSettings({ ...settings, cardStrokeSize: v })} min={0} max={8} />
              <SliderWithInput label="Position Font" value={settings.positionFontSize} onChange={(v) => setSettings({ ...settings, positionFontSize: v })} min={12} max={48} />
              <SliderWithInput label="Position Width" value={settings.positionWidth} onChange={(v) => setSettings({ ...settings, positionWidth: v })} min={24} max={120} />
              <SliderWithInput label="Card Min Height" value={settings.cardMinHeight} onChange={(v) => setSettings({ ...settings, cardMinHeight: v })} min={0} max={200} />
            </>
          )}
          {activeTab === "title" && (
            <>
              <SliderWithInput label="Title Gap" value={settings.titleGap} onChange={(v) => setSettings({ ...settings, titleGap: v })} min={0} max={40} />
              <SliderWithInput label="Title Font" value={settings.titleFontSize} onChange={(v) => setSettings({ ...settings, titleFontSize: v })} min={20} max={72} />
              <SliderWithInput label="Subtitle Font" value={settings.subtitleFontSize} onChange={(v) => setSettings({ ...settings, subtitleFontSize: v })} min={12} max={60} />
              <SliderWithInput label="Line Height" value={settings.titleLineHeight} onChange={(v) => setSettings({ ...settings, titleLineHeight: v })} min={0.8} max={2.5} step={0.1} />
            </>
          )}
          {activeTab === "layout" && (
            <>
              {/* Layout toggle */}
              <div className="flex items-center gap-2 pb-3 border-b border-border-subtle">
                <div className="flex items-center bg-surface-2 rounded-lg border border-border-subtle overflow-hidden">
                  <button
                    onClick={() => setLayout("list")}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${layout === "list" ? "bg-brand text-white" : "text-text-dim hover:text-text-primary"}`}
                  >
                    List
                  </button>
                  <button
                    onClick={() => setLayout("thumbnail")}
                    className={`px-3 py-1.5 text-xs font-medium transition-colors ${layout === "thumbnail" ? "bg-brand text-white" : "text-text-dim hover:text-text-primary"}`}
                  >
                    Thumbnail
                  </button>
                </div>
              </div>
              <SliderWithInput label="Columns" value={columns.length} onChange={handleColumnCountChange} min={1} max={6} />
              <SliderWithInput label="Column Gap" value={settings.columnGap} onChange={(v) => setSettings({ ...settings, columnGap: v, categoryGap: v })} min={8} max={48} />
              <SliderWithInput label="Site Padding" value={settings.sitePadding} onChange={(v) => setSettings({ ...settings, sitePadding: v })} min={0} max={80} />
              <SliderWithInput label="Header Gap" value={settings.topSectionBottomPadding} onChange={(v) => setSettings({ ...settings, topSectionBottomPadding: v })} min={0} max={80} />
            </>
          )}
          {activeTab === "thumbnail" && (
            <>
              <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-border-subtle">
                <Label className="text-sm text-text-primary">Show Title & Date</Label>
                <Switch
                  checked={settings.thumbnailShowText}
                  onCheckedChange={(checked) => setSettings({ ...settings, thumbnailShowText: checked })}
                />
              </div>
              <SliderWithInput label="Title Font Size" value={settings.thumbnailTitleFontSize} onChange={(v) => setSettings({ ...settings, thumbnailTitleFontSize: v })} min={20} max={200} />
              <SliderWithInput label="Date Font Size" value={settings.thumbnailDateFontSize} onChange={(v) => setSettings({ ...settings, thumbnailDateFontSize: v })} min={20} max={200} />
              <SliderWithInput label="Logo Size" value={settings.thumbnailLogoSize} onChange={(v) => setSettings({ ...settings, thumbnailLogoSize: v })} min={20} max={200} />
              <SliderWithInput label="Logo Padding" value={settings.thumbnailLogoPadding} onChange={(v) => setSettings({ ...settings, thumbnailLogoPadding: v })} min={0} max={100} />
              <SliderWithInput label="Row Padding" value={settings.thumbnailRowPadding} onChange={(v) => setSettings({ ...settings, thumbnailRowPadding: v })} min={0} max={150} />
              <SliderWithInput label="Row Offset" value={settings.thumbnailRowOffset} onChange={(v) => setSettings({ ...settings, thumbnailRowOffset: v })} min={-200} max={200} />
              <SliderWithInput label="X Offset" value={settings.thumbnailOffsetX} onChange={(v) => setSettings({ ...settings, thumbnailOffsetX: v })} min={-600} max={600} />
              <SliderWithInput label="Y Offset" value={settings.thumbnailOffsetY} onChange={(v) => setSettings({ ...settings, thumbnailOffsetY: v })} min={-400} max={400} />
              <SliderWithInput label="Rotation" value={settings.thumbnailRotation} onChange={(v) => setSettings({ ...settings, thumbnailRotation: v })} min={-90} max={90} unit="°" />
              <SliderWithInput label="Opacity" value={settings.thumbnailOpacity} onChange={(v) => setSettings({ ...settings, thumbnailOpacity: v })} min={0} max={100} step={1} unit="%" />
            </>
          )}
          {activeTab === "settings" && (
            <div className="flex items-center justify-between p-3 bg-surface-2 rounded-lg border border-border-subtle">
              <Label className="text-sm text-text-primary">Show Presented By Logo</Label>
              <Switch
                checked={settings.showPresentedBy}
                onCheckedChange={(checked) => setSettings({ ...settings, showPresentedBy: checked })}
              />
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
          <input type="file" accept=".csv,.tsv" onChange={handleCSVUpload} className="hidden" />
        </label>
        <button
          onClick={() => setShowUrlDialog(true)}
          className="w-full flex items-center gap-2 px-4 py-2.5 bg-surface-2 border border-border-subtle text-text-primary rounded-lg hover:border-brand hover:text-brand-light text-sm transition-colors"
        >
          <Link className="w-4 h-4" />
          Import from URL
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
    </div>
  );
}
