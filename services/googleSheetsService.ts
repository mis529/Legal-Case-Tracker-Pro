
import { Case, Advocate, CaseType } from '../types';

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzExvIQYIRie4-NB3UVqjpZyuXlDEpONI8OBjTSr7TdsxZXRBvlE-4tR23gBUaWOW1O/exec";

/**
 * SAVE DATA TO GOOGLE SHEETS
 * This sends the raw JSON string to the doPost(e) function in Google Apps Script.
 */
export async function syncToGoogleSheets(data: {
  cases: Case[],
  advocates: Advocate[],
  caseTypes: CaseType[]
}) {
  try {
    console.log("Cloud Sync: Dispatching raw data payload...");
    
    const payload = JSON.stringify(data);

    // Using 'no-cors' and 'text/plain' makes this a 'Simple Request'
    // This allows the request to reach Google's servers even without 
    // explicit CORS headers from the script.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", 
      cache: "no-cache",
      headers: {
        "Content-Type": "text/plain", 
      },
      body: payload,
    });

    console.log("Cloud Sync: Data dispatched to Google Sheets via raw payload.");
    return { status: "success" };
  } catch (error) {
    console.error("Cloud Sync Error:", error);
    throw new Error("Unable to reach Google Sheets. Please ensure your script is deployed as 'Anyone'.");
  }
}

/**
 * LOAD DATA FROM GOOGLE SHEETS
 */
export async function loadFromGoogleSheets() {
  try {
    console.log("Cloud Load: Fetching state...");
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'GET',
        cache: 'no-cache'
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const text = await response.text();
    if (!text || text.trim() === "") return null;
    
    const result = JSON.parse(text);
    console.log("Cloud Load: Data retrieved and parsed.");
    return result;
  } catch (error) {
    console.warn("Cloud Load: Error (Expected if new sheet):", error);
    return null;
  }
}
