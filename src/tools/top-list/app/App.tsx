import { useState, useRef, useEffect } from "react";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { Toaster, toast } from "sonner";
import Papa from "papaparse";
import { domToJpeg } from "modern-screenshot";
import { MarketMapCanvas } from "./components/MarketMapCanvas";
import { ThumbnailCanvas } from "./components/ThumbnailCanvas";
import { ModeToggle } from "./components/ModeToggle";
import { EditControls } from "./components/EditControls";
import { RichTextEditor } from "./components/RichTextEditor";
import { Download, Loader2, FileSpreadsheet } from "lucide-react";
import { preloadImagesToDataUrls } from "./hooks/useImageToDataUrl";
import { convertToGoogleSheetsTsvUrl } from "./utils/googleSheets";

export interface Company {
  id: string;
  position: number;
  name: string;
  url?: string;
  logoUrl: string;
  valuation?: string;
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
  cardPaddingY: number;
  valuationFontSize: number;
  autoCardHeight: boolean;
  showPresentedBy: boolean;
  width: number;
  height: number;
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
  const [title, setTitle] = useState("<b>Top List Companies</b>");
  const [date, setDate] = useState("<b>January 2026</b>");
  const [, setHasSelection] = useState(false);
  const [isExportingJpg, setIsExportingJpg] = useState(false);
  const [activeTab, setActiveTab] = useState<"cards" | "title" | "layout" | "thumbnail" | "settings" | null>("cards");
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
    cardPaddingY: 16,
    valuationFontSize: 13,
    autoCardHeight: false,
    showPresentedBy: true,
    width: 850,
    height: 1100,
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
    thumbnailShowText: true,
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const [containerDims, setContainerDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setContainerDims({ w: width, h: height });
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const canvasW = settings.width || 1920;
  const canvasH = settings.height || 1080;
  const canvasScale = containerDims.w > 0
    ? Math.min(containerDims.w / canvasW, containerDims.h / canvasH) * 0.95
    : 0.5;

  // Load from URL params on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const embedUrl = urlParams.get('e');
    if (!embedUrl) return;

    const tsvUrl = convertToGoogleSheetsTsvUrl(embedUrl);
    toast.loading("Loading data from Google Sheets...");
    fetch(tsvUrl)
      .then(response => {
        if (!response.ok) throw new Error(`Failed to fetch: ${response.status} ${response.statusText}`);
        return response.text();
      })
      .then(tsvContent => {
        toast.dismiss();
        processDataContent(tsvContent, "Google Sheets");
      })
      .catch(error => {
        toast.dismiss();
        toast.error(`Failed to import from URL: ${error instanceof Error ? error.message : 'Unknown error'}`);
      });
  }, []);

  const processDataContent = (tsvContent: string, sourceName: string = "file") => {
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
        const parsed = settingValue.toLowerCase() === 'true' ? true
          : settingValue.toLowerCase() === 'false' ? false
          : !isNaN(Number(settingValue)) ? parseFloat(settingValue)
          : settingValue;
        (parsedSettings as Record<string, unknown>)[settingName] = parsed;
        dataStartIndex = i + 1;
      } else if (line.includes('position') && line.includes('company')) {
        break;
      }
    }

    if (titleValue) setTitle(`<b>${titleValue}</b>`);
    if (dateValue) setDate(`<b>${dateValue}</b>`);
    if (Object.keys(parsedSettings).length > 0) {
      setSettings(prev => ({ ...prev, ...parsedSettings }));
    }

    const contentToProcess = lines.slice(dataStartIndex).join('\n');
    Papa.parse<{ position: string; company: string; logo: string; url?: string; valuation?: string }>(contentToProcess, {
      header: true,
      skipEmptyLines: true,
      delimiter: '\t',
      complete: (results) => {
        if (results.errors.length > 0) { toast.error("Error parsing data"); return; }
        if (results.data.length === 0) { toast.error("Data is empty"); return; }

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
            valuation: row.valuation || undefined,
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
        const itemsPerCol = Math.ceil(companies.length / numColumns);
        companies.forEach((company, index) => {
          const colIndex = Math.min(Math.floor(index / itemsPerCol), numColumns - 1);
          newColumns[colIndex].companies.push(company);
        });
        setColumns(newColumns);
        setMode("preview");
        toast.success(`Loaded ${companies.length} companies from ${sourceName}`);
      },
      error: (error: Error) => toast.error(`Failed to parse data: ${error.message}`),
    });
  };

  // Strip HTML tags for use in filenames / metadata
  const getCleanText = (html: string) => {
    const el = document.createElement('div');
    el.innerHTML = html;
    return el.textContent || el.innerText || '';
  };

  const handleExportJpg = async () => {
    const element = canvasRef.current;
    if (!element) return;
    const wasEdit = mode === "edit";
    if (wasEdit) {
      setMode("preview");
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
    }
    setIsExportingJpg(true);
    try {
      const imgElements = Array.from(element.querySelectorAll<HTMLImageElement>('img'));
      const allSrcs = [...new Set(imgElements.map(img => img.src).filter(Boolean))];
      const dataUrlMap = await preloadImagesToDataUrls(allSrcs);

      const dataUrl = await domToJpeg(element, {
        quality: 0.95,
        scale: 2,
        width: canvasW,
        height: canvasH,
        style: { transform: 'none' },
        fetchFn: async (url: string) => {
          const cached = dataUrlMap.get(url);
          if (cached) return cached;
          return false;
        },
      });

      const cleanTitle = getCleanText(title);
      const cleanDate = getCleanText(date);
      const link = document.createElement('a');
      link.download = `${cleanTitle} - ${cleanDate}.jpg`.replace(/[^a-z0-9\s\-_.]/gi, '_');
      link.href = dataUrl;
      link.click();
      toast.success('JPG exported successfully');
    } catch (err) {
      console.error(err);
      toast.error('Failed to export JPG');
    } finally {
      setIsExportingJpg(false);
      if (wasEdit) setMode("edit");
    }
  };

  const handleExportTsv = () => {
    const cleanTitle = getCleanText(title);
    const cleanDate = getCleanText(date);

    const metadataRows = [
      `__TITLE__\t${cleanTitle}`,
      `__DATE__\t${cleanDate}`,
      `__COLUMNS__\t${columns.length}`,
    ];
    Object.entries(settings).forEach(([key, value]) => metadataRows.push(`__SETTING__${key}\t${value}`));

    const allCompanies: Company[] = [];
    columns.forEach(col => allCompanies.push(...col.companies));
    allCompanies.sort((a, b) => a.position - b.position);

    const dataRows = ['position\tcompany\tlogo\turl\tvaluation'];
    allCompanies.forEach(company => {
      dataRows.push(`${company.position}\t${company.name}\t${company.logoUrl}\t${company.url || ''}\t${company.valuation || ''}`);
    });

    const tsvContent = [...metadataRows, '', ...dataRows].join('\n');
    const blob = new Blob([tsvContent], { type: 'text/tab-separated-values' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cleanTitle} - ${cleanDate}.tsv`.replace(/[^a-z0-9\s\-_.]/gi, '_');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('TSV exported successfully');
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <Toaster position="top-center" richColors />
      <div className="flex h-full overflow-hidden bg-bg">

        {/* Sidebar */}
        <div className="w-96 shrink-0 flex flex-col bg-surface border-r border-border-subtle">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-subtle shrink-0">
            <span className="text-xs font-semibold text-text-dim uppercase tracking-widest font-mono">Top List</span>
            <ModeToggle mode={mode} setMode={setMode} />
          </div>

          {/* Controls */}
          <div className="flex-1 overflow-y-auto min-h-0">
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
              layout={layout}
              setLayout={setLayout}
              setMode={setMode}
            />
          </div>

          {/* Export Footer */}
          <div className="border-t border-border-subtle p-4 shrink-0 space-y-2">
              <h3 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3">Export</h3>
              <button
                onClick={handleExportJpg}
                disabled={isExportingJpg}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-brand text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50 text-sm transition-opacity"
              >
                {isExportingJpg ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                {isExportingJpg ? 'Exporting...' : 'Download JPG'}
              </button>
              <button
                onClick={handleExportTsv}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-2 border border-border-subtle text-text-primary rounded-lg hover:border-brand hover:text-brand-light text-sm transition-colors"
              >
                <FileSpreadsheet size={16} />
                Export TSV
              </button>
            </div>
        </div>

        {/* Canvas Area */}
        <div
          ref={canvasContainerRef}
          className="flex-1 flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: '#0d0c17' }}
        >
          <div style={{ width: canvasW * canvasScale, height: canvasH * canvasScale, flexShrink: 0 }}>
            <div
              ref={canvasRef}
              style={{
                width: canvasW,
                height: canvasH,
                backgroundImage: 'url(/bg.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                transform: `scale(${canvasScale})`,
                transformOrigin: 'top left',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              {/* Top Bar */}
              {layout !== "thumbnail" && (
                <div
                  className="flex flex-col items-center shrink-0"
                  style={{
                    paddingLeft: `${settings.sitePadding}px`,
                    paddingRight: `${settings.sitePadding}px`,
                    paddingTop: `${settings.sitePadding}px`,
                    paddingBottom: `${settings.topSectionBottomPadding}px`,
                    gap: `${settings.titleGap}px`,
                  }}
                >
                  <RichTextEditor
                    value={title}
                    onChange={setTitle}
                    disabled={mode === "preview"}
                    onSelectionChange={setHasSelection}
                    className="bg-transparent border-none outline-none rounded min-h-[40px] text-center"
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      color: '#FAF4EC',
                      fontSize: `${settings.titleFontSize}px`,
                      padding: '2px 8px',
                      lineHeight: `${settings.titleLineHeight}`,
                      fontWeight: 900,
                    }}
                  />
                  <RichTextEditor
                    value={date}
                    onChange={setDate}
                    disabled={mode === "preview"}
                    onSelectionChange={setHasSelection}
                    className="bg-transparent border-none outline-none rounded min-h-[40px] text-center"
                    style={{
                      fontFamily: 'Outfit, sans-serif',
                      color: '#E05642',
                      fontSize: `${settings.subtitleFontSize}px`,
                      padding: '2px 8px',
                      lineHeight: `${settings.titleLineHeight}`,
                      fontWeight: 900,
                    }}
                  />
                </div>
              )}

              {/* Main Content */}
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

              {/* Presented By */}
              {layout !== "thumbnail" && settings.showPresentedBy && (
                <div className="flex flex-col items-end justify-center shrink-0" style={{ gap: '4px', paddingRight: `${settings.sitePadding}px`, paddingBottom: `${settings.sitePadding}px` }}>
                  <div style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '14px', letterSpacing: '1px', color: 'rgba(255,255,255,0.5)' }}>
                    PRESENTED BY
                  </div>
                  <svg width="214" height="25" viewBox="0 0 428 49" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path fillRule="evenodd" clipRule="evenodd" d="M1.47323 39.6856L31.8989 8.73527C37.5765 2.95953 46.8548 2.8867 52.6237 8.57342C52.6318 8.58152 52.64 8.58961 52.6481 8.5977L75.2769 31.0088C75.4882 31.2172 75.8276 31.2151 76.0348 31.0047C76.234 30.8024 76.2421 30.4808 76.0552 30.2684L66.8073 19.8478C65.7446 18.6501 65.6694 16.8678 66.6265 15.5832L70.8267 9.9592C73.444 6.45329 78.4022 5.73714 81.9034 8.35898C82.3443 8.68874 82.7487 9.06502 83.1124 9.47974L109.767 39.904C111.634 42.0363 111.423 45.2812 109.293 47.1525C108.358 47.9739 107.156 48.427 105.912 48.427H5.12887C2.2962 48.427 0 46.1269 0 43.2906C0 41.9412 0.530362 40.6485 1.47323 39.6876V39.6856Z" fill="url(#massiveLogo_grad_tl)"/>
                    <path fillRule="evenodd" clipRule="evenodd" d="M138.035 47.2842L145.805 1.15515H157.583L166.749 25.7491L175.855 1.15515H187.633L195.403 47.2822H183.564L179.618 20.732L168.812 47.2822H164.077L153.817 20.732L149.871 47.2822H138.033L138.035 47.2842ZM227.528 29.9853L222.364 14.9947L217.201 29.9853H227.526H227.528ZM231.498 39.269H214.376L211.623 47.2842H198.841L216.394 1.15515H229.48L247.031 47.2822H234.25L231.498 39.2669V39.269ZM278.158 13.0242C276.839 11.9702 275.52 11.1894 274.204 10.6816C272.885 10.1738 271.609 9.92092 270.373 9.92092C268.807 9.92092 267.53 10.2851 266.541 11.0154C265.551 11.7457 265.057 12.6985 265.057 13.8759C265.057 14.6872 265.303 15.3568 265.799 15.8848C266.293 16.4128 266.943 16.868 267.746 17.2544C268.548 17.6408 269.457 17.9746 270.465 18.2578C271.475 18.541 272.472 18.8465 273.462 19.1702C277.416 20.469 280.31 22.2027 282.145 24.3734C283.978 26.5441 284.894 29.3723 284.894 32.862C284.894 35.2148 284.492 37.3451 283.689 39.2508C282.886 41.1564 281.712 42.7911 280.168 44.1485C278.621 45.508 276.727 46.562 274.482 47.3125C272.237 48.0631 269.692 48.4373 266.85 48.4373C260.959 48.4373 255.501 46.7137 250.473 43.2644L255.663 33.651C257.476 35.233 259.268 36.4104 261.04 37.1792C262.812 37.95 264.562 38.3343 266.293 38.3343C268.27 38.3343 269.743 37.8872 270.711 36.9951C271.68 36.1029 272.163 35.0894 272.163 33.9525C272.163 33.2626 272.039 32.6638 271.794 32.158C271.548 31.6502 271.135 31.185 270.558 30.7581C269.981 30.3312 269.229 29.9367 268.303 29.5726C267.376 29.2085 266.252 28.8018 264.933 28.3547C263.369 27.8672 261.833 27.3311 260.331 26.7424C258.827 26.1537 257.488 25.3728 256.314 24.3997C255.139 23.4266 254.192 22.1987 253.471 20.7178C252.749 19.237 252.39 17.3616 252.39 15.0898C252.39 12.8179 252.772 10.7605 253.534 8.91345C254.296 7.06845 255.367 5.48645 256.746 4.16743C258.126 2.84842 259.815 1.82477 261.814 1.09446C263.812 0.364145 266.047 0 268.518 0C270.824 0 273.236 0.313569 275.748 0.94273C278.262 1.57189 280.672 2.49439 282.978 3.71225L278.158 13.0222V13.0242ZM317.169 13.0242C315.85 11.9702 314.531 11.1894 313.215 10.6816C311.896 10.1738 310.62 9.92092 309.382 9.92092C307.816 9.92092 306.539 10.2851 305.55 11.0154C304.562 11.7457 304.066 12.6985 304.066 13.8759C304.066 14.6872 304.314 15.3568 304.808 15.8848C305.304 16.4128 305.952 16.868 306.755 17.2544C307.557 17.6388 308.464 17.9746 309.474 18.2578C310.484 18.541 311.483 18.8465 312.471 19.1702C316.425 20.469 319.319 22.2027 321.154 24.3734C322.987 26.5441 323.903 29.3723 323.903 32.862C323.903 35.2148 323.501 37.3451 322.698 39.2508C321.896 41.1564 320.721 42.7911 319.175 44.1485C317.63 45.508 315.734 46.562 313.489 47.3125C311.244 48.0631 308.699 48.4373 305.857 48.4373C299.966 48.4373 294.508 46.7137 289.48 43.2644L294.67 33.651C296.483 35.233 298.275 36.4104 300.047 37.1792C301.819 37.95 303.571 38.3343 305.3 38.3343C307.277 38.3343 308.75 37.8872 309.718 36.9951C310.685 36.1029 311.17 35.0894 311.17 33.9525C311.17 33.2626 311.046 32.6638 310.801 32.158C310.553 31.6502 310.142 31.185 309.565 30.7581C308.988 30.3312 308.236 29.9367 307.31 29.5726C306.383 29.2085 305.259 28.8018 303.942 28.3547C302.376 27.8672 300.842 27.3311 299.338 26.7424C297.834 26.1537 296.495 25.3728 295.321 24.3997C294.146 23.4266 293.199 22.1987 292.478 20.7178C291.756 19.237 291.397 17.3616 291.397 15.0898C291.397 12.8179 291.779 10.7605 292.541 8.91345C293.303 7.06845 294.374 5.48645 295.753 4.16743C297.133 2.84842 298.824 1.82477 300.821 1.09446C302.819 0.364145 305.054 0 307.527 0C309.833 0 312.243 0.313569 314.757 0.94273C317.271 1.57189 319.681 2.49439 321.987 3.71225L317.167 13.0222L317.169 13.0242ZM342.265 1.15717V47.2842H330.792V1.15515H342.265V1.15717ZM360.976 1.15717L372.063 29.2368L383.212 1.15717H396.189L376.815 47.2842H367.312L347.999 1.15515H360.976V1.15717ZM427.167 11.3128H412.835V19.0205H426.369V29.1761H412.835V37.1286H427.167V47.2842H400.779V1.15515H427.167V11.3107V11.3128Z" fill="white"/>
                    <defs>
                      <linearGradient id="massiveLogo_grad_tl" x1="35.3351" y1="53.1407" x2="81.1801" y2="19.9295" gradientUnits="userSpaceOnUse">
                        <stop offset="0.29" stopColor="#F69666"/>
                        <stop offset="1" stopColor="#F16D65"/>
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}
