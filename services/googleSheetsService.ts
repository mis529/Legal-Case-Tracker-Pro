import { Case, Advocate, CaseType } from '../types';

// This is your configured Google Script URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzv4-T02kNSWpN71l-JIhatqameuMyLVHtOTNaFmaNrA-yAyP0nO8IXUoZWbFAuHGsh/exec';

/**
 * Sends the current application state to Google Sheets.
 */
export async function syncToGoogleSheets(data: { cases: Case[], advocates: Advocate[], caseTypes: CaseType[] }) {
  // Only throw if it's still the original "YOUR_URL" placeholder (preventing accidental errors)
  if (GOOGLE_SCRIPT_URL.includes('YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE')) {
    throw new Error('Please configure your Google Script URL in services/googleSheetsService.ts');
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps script requires no-cors for standard POST triggers from browser
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // With no-cors, we can't read the response status directly, but the execution happens.
    return true;
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    throw error;
  }
}

/**
 * Loads the application state from Google Sheets.
 */
export async function loadFromGoogleSheets(): Promise<{ cases?: Case[], advocates?: Advocate[], caseTypes?: CaseType[] }> {
  if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('YOUR_GOOGLE_SCRIPT_WEB_APP_URL_HERE')) {
    return {};
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL);
    if (!response.ok) {
        throw new Error('Failed to fetch from Google Sheets');
    }
    const data = await response.json();
    return data || {};
  } catch (error) {
    console.error('Error loading from Google Sheets:', error);
    return {};
  }
}
