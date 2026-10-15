import { Download, FileDown, FileSpreadsheet, FileImage } from "lucide-react";
import { Column, Settings } from "../App";
import { toast } from "sonner";
import { useState } from "react";

interface PreviewControlsProps {
  settings: Settings;
  columns: Column[];
  title: string;
  date: string;
}

export function PreviewControls({ settings, columns, title, date }: PreviewControlsProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExportTSV = () => {
    try {
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
      const filename = `${title} - ${date}.tsv`.replace(/[^a-z0-9\\s\\-_.]/gi, '_');
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('TSV file downloaded successfully');
    } catch (error) {
      console.error('Error downloading TSV:', error);
      toast.error('Failed to download TSV file');
    }
  };

  const handleExportSVG = async () => {
    setIsExporting(true);
    try {
      // Get the market map export area (includes title and canvas)
      const element = document.getElementById('market-map-export-area');
      
      if (!element) {
        toast.error('Export area not found');
        setIsExporting(false);
        return;
      }
      
      const width = element.offsetWidth;
      const height = element.offsetHeight;
      
      // Collect all CSS styles from all stylesheets
      let styles = "";
      const styleSheets = Array.from(document.styleSheets);
      
      styleSheets.forEach((styleSheet) => {
        try {
          const rules = Array.from(styleSheet.cssRules || []);
          rules.forEach((rule) => {
            styles += rule.cssText + "\n";
          });
        } catch (e) {
          // Skip stylesheets we can't access (CORS)
          console.warn('Could not access stylesheet:', e);
        }
      });
      
      // Clone the element
      const clone = element.cloneNode(true) as HTMLElement;
      
      // Apply explicit styles to the clone
      clone.style.width = width + "px";
      clone.style.height = height + "px";
      clone.style.background = "#F7F8FD";
      
      // Inject all CSS into the clone
      const styleElement = document.createElement("style");
      styleElement.textContent = styles;
      clone.insertBefore(styleElement, clone.firstChild);
      
      // Create SVG with proper namespace
      const svgNamespace = "http://www.w3.org/2000/svg";
      const svg = document.createElementNS(svgNamespace, "svg");
      svg.setAttribute("width", width.toString());
      svg.setAttribute("height", height.toString());
      svg.setAttribute("xmlns", svgNamespace);
      
      // Create foreignObject (the container for HTML)
      const foreignObject = document.createElementNS(svgNamespace, "foreignObject");
      foreignObject.setAttribute("width", "100%");
      foreignObject.setAttribute("height", "100%");
      foreignObject.setAttribute("x", "0");
      foreignObject.setAttribute("y", "0");
      
      // Put the HTML clone inside the foreignObject
      foreignObject.appendChild(clone);
      svg.appendChild(foreignObject);
      
      // Serialize to string
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svg);
      
      // Download the file
      const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const filename = `${title} - ${date}.svg`.replace(/[^a-z0-9\\s\\-_.]/gi, '_');
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('SVG file downloaded successfully');
      setIsExporting(false);
    } catch (error) {
      console.error('Error exporting SVG:', error);
      toast.error('Failed to export SVG');
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-3">
      {/* Export Toolbar */}
      <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-300 shadow-sm overflow-hidden">
        {/* TSV Export Button */}
        <button
          onClick={handleExportTSV}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export as TSV"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="font-medium">TSV</span>
        </button>

        {/* Divider */}
        <div className="w-px h-6 bg-gray-300" />

        {/* SVG Export Button */}
        <button
          onClick={handleExportSVG}
          disabled={isExporting}
          className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export as SVG"
        >
          <FileImage className="w-4 h-4" />
          <span className="font-medium">{isExporting ? 'Exporting...' : 'SVG'}</span>
        </button>
      </div>
    </div>
  );
}