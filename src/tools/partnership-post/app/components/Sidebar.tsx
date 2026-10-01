import { ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react';
import { ExportFormat } from '../utils/export';
import { TEMPLATES, TemplateId } from '../constants/templates';

interface SettingsProps {
  imageUrl: string;
  setImageUrl: (url: string) => void;
  template: TemplateId;
  setTemplate: (id: TemplateId) => void;
}

interface ExportProps {
  exporting: boolean;
  onExport: (format: ExportFormat) => void;
}

interface SidebarProps extends SettingsProps, ExportProps {
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const inputClass =
  'w-full px-3 py-2 border border-border-subtle rounded-lg text-sm bg-surface text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand';

/** Partner image and template; the desktop sidebar's body and the phone drawer. */
export function PostSettings({ imageUrl, setImageUrl, template, setTemplate }: SettingsProps) {
  return (
    <div className="p-6 flex flex-col gap-6">
      {/* Image URL */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">Partner image URL</label>
        <input
          type="text"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://example.com/logo.png"
          className={inputClass}
        />
        <p className="text-xs text-text-dim">Can also be set via the <code>?e=</code> URL parameter.</p>
      </div>

      {/* Template */}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-primary">Template</label>
        <div className="grid grid-cols-2 gap-2">
          {Object.values(TEMPLATES).map((t) => (
            <button
              key={t.id}
              onClick={() => setTemplate(t.id)}
              className={`flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium border ${
                template === t.id
                  ? 'bg-brand text-white border-brand'
                  : 'border-border-subtle text-text-primary hover:bg-surface-2'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-text-dim">Can also be set via the <code>?template=</code> URL parameter (<code>?mode=light</code> still works).</p>
      </div>
    </div>
  );
}

/** JPG and PNG download buttons, side by side. */
export function ExportButtons({ exporting, onExport }: ExportProps) {
  return (
    <div className="flex gap-3">
      {(['jpg', 'png'] as const).map((format) => (
        <button
          key={format}
          onClick={() => onExport(format)}
          disabled={exporting}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50"
        >
          {exporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {format.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

/** Desktop sidebar, collapsible. */
export function Sidebar({ sidebarOpen, setSidebarOpen, exporting, onExport, ...settings }: SidebarProps) {
  return (
    <div className="relative flex h-full">
      <div
        className={`bg-surface border-r border-border-subtle flex flex-col overflow-hidden transition-all duration-300 ease-in-out h-full ${
          sidebarOpen ? 'w-96' : 'w-0'
        }`}
      >
        {/* Header */}
        <div className="p-6 border-b border-border-subtle">
          <h1 className="text-base font-semibold text-text-primary tracking-tight">Partnership Post</h1>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          <PostSettings {...settings} />

          {/* Export */}
          <div className="mx-6 flex flex-col gap-2 pt-6 border-t border-border-subtle">
            <label className="text-sm font-medium text-text-primary">Export</label>
            <ExportButtons exporting={exporting} onExport={onExport} />
          </div>
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute top-4 -right-3 z-10 w-6 h-6 flex items-center justify-center bg-surface border border-border-subtle rounded-full text-text-dim hover:text-text-primary"
      >
        {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>
    </div>
  );
}
