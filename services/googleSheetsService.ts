
import { Case, Advocate, CaseType } from '../types';

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzExvIQYIRie4-NB3UVqjpZyuXlDEpONI8OBjTSr7TdsxZXRBvlE-4tR23gBUaWOW1O/exec";

/**
 * SYNC DATA TO GOOGLE SHEETS
 * Matches your GAS doPost(e) logic:
 * - Sends JSON.stringify({ cases, advocates, caseTypes })
 * - Uses 'no-cors' to bypass preflight OPTIONS request which GAS doesn't support.
 * - Body is sent as raw text, which GAS captures in e.postData.contents.
 */
export async function syncToGoogleSheets(data: {
  cases: Case[],
  advocates: Advocate[],
  caseTypes: CaseType[]
}) {
  try {
    console.log("Cloud Sync: Initiating data push...");
    
    // Ensure we send a valid JSON string
    const payload = JSON.stringify({
      cases: data.cases || [],
      advocates: data.advocates || [],
      caseTypes: data.caseTypes || []
    });

    // We MUST use mode: 'no-cors' for POST to Google Apps Script.
    // This makes it an 'opaque' request. We won't be able to read the response status
    // or body in the browser, but the script WILL execute on the server.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", 
      cache: "no-cache",
      redirect: "follow",
      headers: {
        "Content-Type": "text/plain", 
      },
      body: payload,
    });

    console.log("Cloud Sync: Request sent. Please check your Google Sheet tabs ('Cases', 'Advocates', 'CaseTypes').");
    return { status: "success" };
  } catch (error) {
    console.error("Cloud Sync: Critical failure:", error);
    throw new Error("Network error while trying to reach Google Sheets. Ensure your URL is correct and you have internet access.");
  }
}

/**
 * LOAD DATA FROM GOOGLE SHEETS
 * Matches your GAS doGet() logic:
 * - Fetches structured JSON { cases, advocates, caseTypes }
 */
export async function loadFromGoogleSheets() {
  try {
    console.log("Cloud Load: Fetching data from Google Sheets...");
    
    // GET requests to GAS are redirect-heavy. fetch handles this.
    // We use mode: 'cors' (default) because GAS ContentService handles the CORS headers on redirect.
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'follow'
    });

    if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: Failed to reach Google Script.`);
    }
    
    const text = await response.text();
    
    // If the response is empty or HTML (likely a Google error page), parsing will fail.
    try {
        const result = JSON.parse(text);
        
        // Basic validation of expected keys
        if (result && (Array.isArray(result.cases) || Array.isArray(result.advocates) || Array.isArray(result.caseTypes))) {
          console.log("Cloud Load: Successfully synchronized with cloud storage.");
          return result;
        }
    } catch (parseError) {
        console.warn("Cloud Load: Received non-JSON response. This often happens if the Script is not deployed as 'Anyone'.", text.substring(0, 100));
        return null;
    }
    
    return null;
  } catch (error) {
    console.warn("Cloud Load: Data could not be retrieved from the cloud. Falling back to local state.", error);
    return null;
  }
}
