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
    <div
      className="flex-1 flex flex-row flex-wrap items-start justify-center p-8 overflow-auto gap-10"
      style={{
        backgroundImage: `
          linear-gradient(rgba(250, 244, 236, 0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(250, 244, 236, 0.04) 1px, transparent 1px)
        `,
        backgroundSize: '24px 24px',
        backgroundColor: '#242333',
      }}
    >
      {/* LinkedIn Canvas */}
      <div className="flex flex-col items-center gap-4">
        <h3 className="text-lg font-semibold text-text-primary">LinkedIn (1080x1350)</h3>
        <div style={{ width: 1080 * 0.4, height: 1350 * 0.4 }}>
          <div
            ref={linkedinCanvasRef}
            className="shadow-2xl relative overflow-hidden"
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
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50"
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
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50"
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
        <h3 className="text-lg font-semibold text-text-primary">X/Twitter (1200x675)</h3>
        <div style={{ width: 1200 * 0.5, height: 675 * 0.5 }}>
          <div
            ref={twitterCanvasRef}
            className="shadow-2xl relative overflow-hidden"
            style={{
              width: 1200,
              height: 675,
              transform: 'scale(0.5)',
              transformOrigin: 'top left',
            }}
          >
            {/* Background rotated 90° clockwise — only for light/dark themes */}
            {theme !== 'pc-speaker' && (
              <div
                style={{
                  position: 'absolute',
                  zIndex: 0,
                  width: 675,
                  height: 1200,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%) rotate(90deg)',
                  backgroundImage: `url(${THEMES[theme].twitter.backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
            {/* pc-speaker keeps its original background unrotated */}
            {theme === 'pc-speaker' && (
              <div
                style={{
                  position: 'absolute',
                  zIndex: 0,
                  inset: 0,
                  backgroundImage: `url(${THEMES[theme].twitter.backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }}
              />
            )}
            <div style={{ position: 'relative', zIndex: 1, width: '100%', height: '100%' }}>
              {renderCanvasContent('twitter')}
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => handleExportCanvas(twitterCanvasRef, 'twitter', 'jpg')}
            disabled={exportingTwitter}
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50"
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
            className="flex items-center gap-2 px-4 py-2 bg-brand text-white rounded-lg hover:opacity-90 font-medium disabled:opacity-50"
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
