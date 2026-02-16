
import { Case, Advocate, CaseType } from '../types';

/**
 * Your specific Google Apps Script Web App URL.
 * Ensure this script is deployed as a Web App, executed as 'Me', and accessible by 'Anyone'.
 */
const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzExvIQYIRie4-NB3UVqjpZyuXlDEpONI8OBjTSr7TdsxZXRBvlE-4tR23gBUaWOW1O/exec";

/**
 * SAVE DATA TO GOOGLE SHEETS
 * Uses 'no-cors' mode to bypass CORS preflight (OPTIONS) issues.
 * This sends the data as a string to your Google Script's doPost(e) function.
 */
export async function syncToGoogleSheets(data: {
  cases: Case[],
  advocates: Advocate[],
  caseTypes: CaseType[]
}) {
  try {
    console.log("Cloud Sync: Sending data...");
    
    // We send data as a simple string to avoid triggering a preflight request
    // that Google Apps Script Web Apps often do not handle correctly.
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", 
      cache: "no-cache",
      headers: {
        "Content-Type": "text/plain", 
      },
      body: JSON.stringify(data),
    });

    console.log("Cloud Sync: Request sent successfully.");
    return { status: "success" };
  } catch (error) {
    console.error("Cloud Sync POST Error:", error);
    throw new Error("Failed to reach the cloud service. Please check your internet connection and script deployment settings.");
  }
}

/**
 * LOAD DATA FROM GOOGLE SHEETS
 * Fetches the current state from your Google Script's doGet(e) function.
 */
export async function loadFromGoogleSheets() {
  try {
    console.log("Cloud Load: Fetching data...");
    
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'GET',
        cache: 'no-cache'
    });

    if (!response.ok) {
        throw new Error(`Cloud server returned status ${response.status}`);
    }
    
    const result = await response.json();
    console.log("Cloud Load: Success.", result);
    return result;
  } catch (error) {
    console.warn("Cloud Load Error:", error);
    // Returning null allows the app to fallback gracefully to LocalStorage
    return null;
  }
}
