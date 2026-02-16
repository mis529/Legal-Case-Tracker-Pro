
import { Case, Advocate, CaseType } from '../types';

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzv4-T02kNSWpN71l-JIhatqameuMyLVHtOTNaFmaNrA-yAyP0nO8IXUoZWbFAuHGsh/exec";

/**
 * SAVE DATA TO GOOGLE SHEETS
 * Uses 'no-cors' mode to bypass CORS preflight issues common with Google Apps Script.
 */
export async function syncToGoogleSheets(data: {
  cases: Case[],
  advocates: Advocate[],
  caseTypes: CaseType[]
}) {
  try {
    // We use text/plain or no-cors to avoid the OPTIONS preflight which GAS doesn't handle well
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", 
      headers: {
        "Content-Type": "text/plain", // Using text/plain avoids preflight but we send JSON string
      },
      body: JSON.stringify(data),
    });

    // Since mode is 'no-cors', we can't read the response body. 
    // If it didn't throw an exception, the request was successfully dispatched.
    return { status: "success" };
  } catch (error) {
    console.error("POST error:", error);
    throw new Error("Failed to reach the cloud service. Please check your internet or script URL.");
  }
}

/**
 * LOAD DATA FROM GOOGLE SHEETS
 */
export async function loadFromGoogleSheets() {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL);
    if (!response.ok) throw new Error("Cloud service responded with an error.");
    
    const result = await response.json();
    console.log("GET result:", result);
    return result;
  } catch (error) {
    console.error("GET error:", error);
    throw error;
  }
}
