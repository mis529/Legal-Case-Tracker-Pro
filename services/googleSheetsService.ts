
import { Case, Advocate, CaseType } from '../types';

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzExvIQYIRie4-NB3UVqjpZyuXlDEpONI8OBjTSr7TdsxZXRBvlE-4tR23gBUaWOW1O/exec";

/**
 * SAVE DATA TO GOOGLE SHEETS
 * Uses URLSearchParams to send a "Simple Request" that bypasses CORS.
 */
export async function syncToGoogleSheets(data: {
  cases: Case[],
  advocates: Advocate[],
  caseTypes: CaseType[]
}) {
  try {
    console.log("Cloud Sync: Initiating transfer...");
    
    // We wrap the JSON in a form field named 'json'. 
    // This is the most compatible way for Google Apps Script to receive data.
    const formData = new URLSearchParams();
    formData.append('json', JSON.stringify(data));

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", // Necessary for Google Apps Script
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData.toString(),
    });

    console.log("Cloud Sync: Data sent to Google Sheets.");
    return { status: "success" };
  } catch (error) {
    console.error("Cloud Sync Error:", error);
    throw new Error("Cloud connection failed. Verify your Script URL and Deployment settings.");
  }
}

/**
 * LOAD DATA FROM GOOGLE SHEETS
 */
export async function loadFromGoogleSheets() {
  try {
    console.log("Cloud Load: Fetching latest data...");
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'GET',
        cache: 'no-cache'
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    
    const result = await response.json();
    console.log("Cloud Load: Successfully retrieved data.");
    return result;
  } catch (error) {
    console.warn("Cloud Load: Could not retrieve data (this is normal if no data has been synced yet).", error);
    return null;
  }
}
