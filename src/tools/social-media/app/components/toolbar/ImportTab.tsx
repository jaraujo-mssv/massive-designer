import React from 'react';
import { Play, ExternalLink, Trash2, BookMarked, Upload } from 'lucide-react';
import { SavedSpreadsheet } from '../../types';

interface ImportTabProps {
  spreadsheetUrl: string;
  setSpreadsheetUrl: (url: string) => void;
  isLoading: boolean;
  error: string;
  savedSpreadsheets: SavedSpreadsheet[];
  currentSpreadsheetId: string | null;
  handleImport: () => void;
  loadSpreadsheet: (spreadsheet: SavedSpreadsheet) => void;
  openSpreadsheet: (url: string) => void;
  deleteSpreadsheet: (id: string) => void;
}

export function ImportTab({
  spreadsheetUrl,
  setSpreadsheetUrl,
  isLoading,
  error,
  savedSpreadsheets,
  currentSpreadsheetId,
  handleImport,
  loadSpreadsheet,
  openSpreadsheet,
  deleteSpreadsheet,
}: ImportTabProps) {
  return (
    <div className="space-y-6">
      {/* Google Sheets Integration */}
      <div>
        <h3 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3">
          Google Spreadsheet
        </h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
              placeholder="Paste Google Sheets URL"
              className="flex-1 px-3 py-2 border border-border-subtle rounded-lg text-sm bg-surface-2 text-text-primary placeholder:text-text-dim focus:outline-none focus:border-brand"
            />
            <button
              onClick={handleImport}
              disabled={isLoading || !spreadsheetUrl}
              className="flex items-center justify-center px-3 py-2 bg-brand text-white rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              title="Import Designs"
            >
              <Upload size={18} />
            </button>
          </div>
          {error && (
            <div
              className="p-3 rounded-lg text-sm text-brand-light"
              style={{ backgroundColor: 'var(--red-glow)', border: '1px solid rgba(215,73,57,0.2)' }}
            >
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Saved Spreadsheets */}
      {savedSpreadsheets.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-text-dim uppercase tracking-widest mb-3">
            <BookMarked size={12} className="inline mr-1.5" />
            Saved Spreadsheets
          </h3>
          <div className="space-y-1.5">
            {savedSpreadsheets.map((sheet) => (
              <div
                key={sheet.id}
                className={`flex items-center justify-between p-2.5 rounded-lg border transition-colors ${
                  currentSpreadsheetId === sheet.id
                    ? 'border-brand'
                    : 'border-border-subtle hover:border-border-hov'
                }`}
                style={
                  currentSpreadsheetId === sheet.id
                    ? { backgroundColor: 'var(--red-glow)' }
                    : { backgroundColor: 'var(--surface-2)' }
                }
              >
                <span
                  className={`text-sm flex-1 truncate ${
                    currentSpreadsheetId === sheet.id ? 'text-brand-light font-medium' : 'text-text-primary'
                  }`}
                >
                  {sheet.name}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={() => loadSpreadsheet(sheet)}
                    className="p-1.5 text-brand hover:bg-surface rounded"
                    title="Load designs"
                  >
                    <Play size={14} />
                  </button>
                  <button
                    onClick={() => openSpreadsheet(sheet.url)}
                    className="p-1.5 text-text-dim hover:bg-surface rounded"
                    title="Open in new window"
                  >
                    <ExternalLink size={14} />
                  </button>
                  {!sheet.isSample && (
                    <button
                      onClick={() => deleteSpreadsheet(sheet.id)}
                      className="p-1.5 text-red-400 hover:bg-surface rounded"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
