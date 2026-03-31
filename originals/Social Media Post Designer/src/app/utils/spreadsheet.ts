import Papa from 'papaparse';
import { ImportedDesign } from '../types';

export const convertToCSVUrl = (url: string): string => {
  const match = url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (match) {
    const sheetId = match[1];
    return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
  }
  return url;
};

export const extractSpreadsheetName = async (url: string): Promise<string> => {
  try {
    const response = await fetch(url);
    const html = await response.text();
    
    // Extract title from HTML
    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    if (titleMatch && titleMatch[1]) {
      // Remove " - Google Sheets" suffix if present
      let title = titleMatch[1].replace(/\s*-\s*Google\s+(Sheets|スプレッドシート|試算表).*$/i, '').trim();
      return title || `Spreadsheet ${new Date().toLocaleDateString()}`;
    }
  } catch (err) {
    console.error('Failed to extract spreadsheet name:', err);
  }
  return `Spreadsheet ${new Date().toLocaleDateString()}`;
};

export const fetchAndParseSpreadsheet = async (
  url: string
): Promise<{ designs: ImportedDesign[]; error?: string }> => {
  try {
    const csvUrl = convertToCSVUrl(url);
    const response = await fetch(csvUrl);
    const csvText = await response.text();

    return new Promise((resolve) => {
      Papa.parse(csvText, {
        header: true,
        complete: (results) => {
          const importedDesigns = results.data
            .filter((row: any) => row.title)
            .map((row: any) => ({
              title: row.title || '',
              theme: row.theme || 'light',
              size: row.size || '1080x1350',
              heading: row.heading || '',
              header: row.header || '',
              body: row.body || '',
              image: row.image || '',
              partner: row.partner || '',
            }));
          resolve({ designs: importedDesigns });
        },
        error: () => {
          resolve({ designs: [], error: 'Failed to parse spreadsheet' });
        },
      });
    });
  } catch (err) {
    return { designs: [], error: 'Failed to fetch spreadsheet' };
  }
};
