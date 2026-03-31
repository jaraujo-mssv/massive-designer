/**
 * Converts a Google Sheets URL to TSV export format
 * Handles various Google Sheets URL formats and converts them to the export URL
 * 
 * @param url - The Google Sheets URL (edit, view, or already export format) or just the spreadsheet ID
 * @returns The TSV export URL, or the original URL if not a Google Sheets URL
 */
export function convertToGoogleSheetsTsvUrl(url: string): string {
  try {
    // Check if it's already an export URL
    if (url.includes('/export?format=tsv')) {
      return url;
    }

    // Check if it's just a spreadsheet ID (no http/https)
    // Google Sheets IDs are alphanumeric with dashes, underscores, typically 44 chars but can vary
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Check if it looks like a valid Google Sheets ID
      if (/^[a-zA-Z0-9-_]+$/.test(url.trim())) {
        const spreadsheetId = url.trim();
        return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=tsv`;
      }
      // If it doesn't look like an ID, return original (might be a relative path or something else)
      return url;
    }

    // Extract spreadsheet ID from Google Sheets URL
    // Pattern: /spreadsheets/d/{ID}/
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);

    if (match && match[1]) {
      const spreadsheetId = match[1];
      return `https://docs.google.com/spreadsheets/d/${spreadsheetId}/export?format=tsv`;
    }

    // If not a Google Sheets URL, return original
    return url;
  } catch (error) {
    console.error('Error converting Google Sheets URL:', error);
    return url;
  }
}