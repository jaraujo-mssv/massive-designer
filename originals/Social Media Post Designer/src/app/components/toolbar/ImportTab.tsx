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
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          Paste your Google Spreadsheet link here:
        </h3>
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={spreadsheetUrl}
              onChange={(e) => setSpreadsheetUrl(e.target.value)}
              placeholder="Paste Google Sheets URL"
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={handleImport}
              disabled={isLoading || !spreadsheetUrl}
              className="flex items-center justify-center px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Import Designs"
            >
              <Upload size={20} />
            </button>
          </div>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Saved Spreadsheets */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">
          <BookMarked size={16} className="inline mr-2" />
          Saved Spreadsheets
        </h3>
        <div className="space-y-1.5">
          {savedSpreadsheets.map((sheet) => (
            <div
              key={sheet.id}
              className={`flex items-center justify-between p-2.5 bg-white border rounded-lg ${
                currentSpreadsheetId === sheet.id
                  ? 'border-orange-500 bg-orange-50'
                  : 'border-gray-200 hover:border-orange-300'
              }`}
            >
              <span className={`text-sm flex-1 truncate ${
                currentSpreadsheetId === sheet.id ? 'text-orange-900 font-medium' : 'text-gray-900'
              }`}>
                {sheet.name}
              </span>
              <div className="flex gap-1">
                <button
                  onClick={() => loadSpreadsheet(sheet)}
                  className="p-1.5 text-orange-600 hover:bg-orange-50 rounded"
                  title="Load designs"
                >
                  <Play size={14} />
                </button>
                <button
                  onClick={() => openSpreadsheet(sheet.url)}
                  className="p-1.5 text-gray-600 hover:bg-gray-100 rounded"
                  title="Open in new window"
                >
                  <ExternalLink size={14} />
                </button>
                {!sheet.isSample && (
                  <button
                    onClick={() => deleteSpreadsheet(sheet.id)}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
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
    </div>
  );
}
