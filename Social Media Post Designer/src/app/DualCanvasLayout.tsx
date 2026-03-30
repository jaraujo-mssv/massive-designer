import React from 'react';
import { Download, Loader2 } from 'lucide-react';
import { ExportFormat, Theme, Template, ThemesConfig } from './types';

interface DualCanvasLayoutProps {
  linkedinCanvasRef: React.RefObject<HTMLDivElement>;
  twitterCanvasRef: React.RefObject<HTMLDivElement>;
  renderCanvasContent: (template: Template) => React.ReactNode;
  handleExportCanvas: (ref: React.RefObject<HTMLDivElement>, template: Template, format: ExportFormat) => Promise<void>;
  exportingLinkedin: boolean;
  exportingTwitter: boolean;
  theme: Theme;
  THEMES: ThemesConfig;
}

export function DualCanvasLayout({
  linkedinCanvasRef,
  twitterCanvasRef,
  renderCanvasContent,
  handleExportCanvas,
  exportingLinkedin,
  exportingTwitter,
  theme,
  THEMES,
}: DualCanvasLayoutProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-start p-8 overflow-auto gap-12"
      style={{
        backgroundImage: `
          linear-gradient(rgba(209, 213, 219, 0.3) 1px, transparent 1px),
          linear-gradient(90deg, rgba(209, 213, 219, 0.3) 1px, transparent 1px)
        `,
        backgroundSize: '20px 20px',
        backgroundColor: '#f3f4f6'
      }}
    >
      {/* LinkedIn Canvas */}
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-900">LinkedIn (1080x1350)</h3>
        <div style={{ width: 1080 * 0.4, height: 1350 * 0.4 }}>
          <div
            ref={linkedinCanvasRef}
            className="bg-white shadow-2xl relative overflow-hidden"
            style={{
              width: 1080,
              height: 1350,
              backgroundImage: `url(${THEMES[theme].linkedin.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: 'scale(0.4)',
              transformOrigin: 'top left',
            }}
          >
            {renderCanvasContent('linkedin')}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleExportCanvas(linkedinCanvasRef, 'linkedin', 'jpg')}
            disabled={exportingLinkedin}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
          >
            {exportingLinkedin ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} />
                Export JPG
              </>
            )}
          </button>
          <button
            onClick={() => handleExportCanvas(linkedinCanvasRef, 'linkedin', 'png')}
            disabled={exportingLinkedin}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
          >
            {exportingLinkedin ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} />
                Export PNG
              </>
            )}
          </button>
        </div>
      </div>

      {/* X/Twitter Canvas */}
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-semibold text-gray-900">X/Twitter (1200x675)</h3>
        <div style={{ width: 1200 * 0.5, height: 675 * 0.5 }}>
          <div
            ref={twitterCanvasRef}
            className="bg-white shadow-2xl relative overflow-hidden"
            style={{
              width: 1200,
              height: 675,
              backgroundImage: `url(${THEMES[theme].twitter.backgroundImage})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              transform: 'scale(0.5)',
              transformOrigin: 'top left',
            }}
          >
            {renderCanvasContent('twitter')}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleExportCanvas(twitterCanvasRef, 'twitter', 'jpg')}
            disabled={exportingTwitter}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
          >
            {exportingTwitter ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} />
                Export JPG
              </>
            )}
          </button>
          <button
            onClick={() => handleExportCanvas(twitterCanvasRef, 'twitter', 'png')}
            disabled={exportingTwitter}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 font-medium disabled:opacity-50"
          >
            {exportingTwitter ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download size={18} />
                Export PNG
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}