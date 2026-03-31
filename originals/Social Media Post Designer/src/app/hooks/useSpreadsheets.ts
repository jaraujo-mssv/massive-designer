import { useState, useEffect } from 'react';
import { SavedSpreadsheet, ImportedDesign } from '../types';
import { SAMPLE_SPREADSHEET } from '../constants';
import { fetchAndParseSpreadsheet, extractSpreadsheetName } from '../utils/spreadsheet';

export function useSpreadsheets() {
  const [savedSpreadsheets, setSavedSpreadsheets] = useState<SavedSpreadsheet[]>([SAMPLE_SPREADSHEET]);
  const [currentSpreadsheetId, setCurrentSpreadsheetId] = useState<string | null>(null);
  const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
  const [designs, setDesigns] = useState<ImportedDesign[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Load saved spreadsheets from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('savedSpreadsheets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setSavedSpreadsheets([SAMPLE_SPREADSHEET, ...parsed]);
      } catch (e) {
        console.error('Failed to load saved spreadsheets');
      }
    }
  }, []);

  const saveSpreadsheetsToStorage = (sheets: SavedSpreadsheet[]) => {
    const toSave = sheets.filter(s => !s.isSample);
    localStorage.setItem('savedSpreadsheets', JSON.stringify(toSave));
  };

  const handleImport = async () => {
    if (!spreadsheetUrl) return;

    setIsLoading(true);
    setError('');

    const result = await fetchAndParseSpreadsheet(spreadsheetUrl);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
      return;
    }

    setDesigns(result.designs);

    // Save spreadsheet if not already saved
    const existing = savedSpreadsheets.find(s => s.url === spreadsheetUrl);
    if (!existing) {
      const name = await extractSpreadsheetName(spreadsheetUrl);
      const newSheet: SavedSpreadsheet = {
        id: Date.now().toString(),
        name,
        url: spreadsheetUrl,
      };
      const updated = [...savedSpreadsheets, newSheet];
      setSavedSpreadsheets(updated);
      saveSpreadsheetsToStorage(updated);
      setCurrentSpreadsheetId(newSheet.id);
    } else {
      setCurrentSpreadsheetId(existing.id);
    }

    setIsLoading(false);
  };

  const loadSpreadsheet = async (spreadsheet: SavedSpreadsheet) => {
    setSpreadsheetUrl(spreadsheet.url);
    setCurrentSpreadsheetId(spreadsheet.id);
    setIsLoading(true);
    setError('');

    const result = await fetchAndParseSpreadsheet(spreadsheet.url);

    if (result.error) {
      setError(result.error);
    } else {
      setDesigns(result.designs);
    }

    setIsLoading(false);
  };

  const deleteSpreadsheet = (id: string) => {
    if (window.confirm('Are you sure you want to delete this spreadsheet?')) {
      const updated = savedSpreadsheets.filter(s => s.id !== id);
      setSavedSpreadsheets(updated);
      saveSpreadsheetsToStorage(updated);
      if (currentSpreadsheetId === id) {
        setCurrentSpreadsheetId(null);
        setDesigns([]);
      }
    }
  };

  const openSpreadsheet = (url: string) => {
    window.open(url, '_blank');
  };

  return {
    savedSpreadsheets,
    currentSpreadsheetId,
    spreadsheetUrl,
    setSpreadsheetUrl,
    designs,
    isLoading,
    error,
    handleImport,
    loadSpreadsheet,
    deleteSpreadsheet,
    openSpreadsheet,
  };
}
