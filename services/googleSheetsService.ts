
import { Case, Advocate, CaseType } from '../types';

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzExvIQYIRie4-NB3UVqjpZyuXlDEpONI8OBjTSr7TdsxZXRBvlE-4tR23gBUaWOW1O/exec";

/**
 * SYNC DATA TO GOOGLE SHEETS
 * Matches your GAS doPost(e) logic:
 * - Sends JSON.stringify({ cases, advocates, caseTypes })
 * - Uses 'text/plain' to bypass CORS preflight and reach e.postData.contents
 */
export async function syncToGoogleSheets(data: {
  cases: Case[],
  advocates: Advocate[],
  caseTypes: CaseType[]
}) {
  try {
    console.log("Cloud Sync: Preparing structured payload for multi-sheet save...");
    
    // Ensure the payload structure matches what the GAS script expects
    const payload = JSON.stringify({
      cases: data.cases || [],
      advocates: data.advocates || [],
      caseTypes: data.caseTypes || []
    });

    // We use 'no-cors' for POST to Google Apps Script. 
    // This allows the request to be sent and executed on the server, 
    // even if the browser doesn't let us read the 'Success' response body.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", 
      cache: "no-cache",
      headers: {
        "Content-Type": "text/plain", 
      },
      body: payload,
    });

    console.log("Cloud Sync: Payload delivered to Google Script. Check your 'Cases', 'Advocates', and 'CaseTypes' tabs.");
    return { status: "success" };
  } catch (error) {
    console.error("Cloud Sync Error:", error);
    throw new Error("Connection failed. Check your internet and ensure the Script is deployed as 'Anyone'.");
  }
}

/**
 * LOAD DATA FROM GOOGLE SHEETS
 * Matches your GAS doGet() logic:
 * - Fetches structured JSON { cases, advocates, caseTypes }
 */
export async function loadFromGoogleSheets() {
  try {
    console.log("Cloud Load: Fetching structured data from sheets...");
    
    // For GET, we need 'cors' to read the returned JSON
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'GET',
        cache: 'no-cache'
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
    
    const result = await response.json();
    
    // Validate that we received the expected structure
    if (result && (result.cases || result.advocates || result.caseTypes)) {
      console.log("Cloud Load: Successfully synchronized with Google Sheets.");
      return result;
    }
    
    return null;
  } catch (error) {
    console.warn("Cloud Load: No data found or connection issue. Using local storage.", error);
    return null;
  }
}
