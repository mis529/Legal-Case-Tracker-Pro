
import { Case, Advocate, CaseType } from '../types';

// Replace this URL with your actual Google Apps Script Web App URL
const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzv4-T02kNSWpN71l-JIhatqameuMyLVHtOTNaFmaNrA-yAyP0nO8IXUoZWbFAuHGsh/exec';

export async function syncToGoogleSheets(data: { cases: Case[], advocates: Advocate[], caseTypes: CaseType[] }) {
  if (GOOGLE_SCRIPT_URL.includes('https://script.google.com/macros/s/AKfycbzv4-T02kNSWpN71l-JIhatqameuMyLVHtOTNaFmaNrA-yAyP0nO8IXUoZWbFAuHGsh/exec')) {
    throw new Error('Please configure your Google Script URL in services/googleSheetsService.ts');
  }

  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors', // Apps script requires no-cors or specialized handling
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    // Note: with no-cors, we can't read the response body, 
    // but the request will still execute on the server.
    return true;
  } catch (error) {
    console.error('Error syncing to Google Sheets:', error);
    throw error;
  }
}
