
import { Case, Advocate, CaseType, FeePayment, CaseDirection } from '../types';

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzExvIQYIRie4-NB3UVqjpZyuXlDEpONI8OBjTSr7TdsxZXRBvlE-4tR23gBUaWOW1O/exec";

/**
 * STRIPS literal quotes and trims whitespace from spreadsheet data
 */
function cleanValue(val: any): any {
  if (typeof val === 'string') {
    // Remove literal double quotes at start/end or escaped quotes
    return val.replace(/^"|"$/g, '').replace(/\\"/g, '"').trim();
  }
  return val;
}

/**
 * HELPER: Deeply search for a value in an object using multiple possible key variations.
 */
function fuzzyGet(obj: any, keys: string[]): any {
  if (!obj) return undefined;
  const normalizedObj: Record<string, any> = {};
  
  Object.keys(obj).forEach(k => {
    const cleanK = k.toString().toLowerCase().replace(/[\s_]/g, '');
    normalizedObj[cleanK] = obj[k];
  });
  
  for (const key of keys) {
    const cleanKey = key.toLowerCase().replace(/[\s_]/g, '');
    if (normalizedObj[cleanKey] !== undefined) return cleanValue(normalizedObj[cleanKey]);
  }
  return undefined;
}

/**
 * SAFE DATE PARSER: Handles garbage like "jjjhj"
 */
function safeDate(dateStr: any): string {
  const cleaned = cleanValue(dateStr);
  if (!cleaned) return new Date().toISOString();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

/**
 * SYNC DATA TO GOOGLE SHEETS
 */
export async function syncToGoogleSheets(data: {
  cases: Case[],
  advocates: Advocate[],
  caseTypes: CaseType[]
}) {
  try {
    const payload = JSON.stringify({
      cases: data.cases.map(c => ({
        "Case No": c.caseNumber,
        "Court": c.courtName,
        "Case Type": data.caseTypes.find(t => t.id === c.caseTypeId)?.name || "Other",
        "Advocate": data.advocates.find(a => a.id === c.advocateId)?.name || "Unassigned",
        "Next Hearing": c.nextHearingDate,
        "Remarks": c.advocateComments,
        "Created Date": c.createdAt,
        "_id": c.id,
        "_advocateId": c.advocateId,
        "_caseDirection": c.caseDirection,
        "_courseOfAction": c.courseOfAction,
        "_personAppearing": c.personAppearing
      })),
      advocates: data.advocates.map(adv => ({
        "Advocate Name": adv.name,
        "Mobile": adv.phone || "",
        "_id": adv.id
      })),
      payments: data.cases.flatMap(c => c.feePayments.map(p => ({
        "Case No": c.caseNumber,
        "Amount": p.amount,
        "Paid Date": p.date,
        "Mode": p.notes || ""
      }))),
      timestamp: new Date().toISOString()
    });

    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      mode: "no-cors", 
      cache: "no-cache",
      headers: { "Content-Type": "text/plain" },
      body: payload,
    });

    return { status: "success" };
  } catch (error) {
    console.error("Critical Cloud Sync Error:", error);
    throw error;
  }
}

/**
 * LOAD DATA FROM GOOGLE SHEETS
 */
export async function loadFromGoogleSheets() {
  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'follow'
    });

    if (!response.ok) throw new Error(`Google Script returned HTTP ${response.status}`);
    
    let text = await response.text();
    console.debug("Cloud Raw Response:", text);
    
    // FIX: If response contains multiple JSON objects concatenated (e.g. {}{}), take only the first one
    if (text.includes('}{')) {
        console.warn("Detected corrupted/concatenated JSON response. Attempting to fix...");
        text = text.split('}{')[0] + '}';
    }

    let result;
    try {
        result = JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse Cloud JSON. Trying to fix quotes...");
        try {
            // Last ditch effort: replace potential issues
            result = JSON.parse(text.replace(/\\"/g, '"'));
        } catch (e2) {
            return null;
        }
    }

    if (!result || !result.cases) return null;

    // 1. Process Advocates
    const advocates: Advocate[] = (result.advocates || []).map((a: any, idx: number) => {
        const name = fuzzyGet(a, ["Advocate Name", "Advocate", "Name"]) || "Unknown Advocate";
        if (name === "" || name === '""') return null; // Skip empty rows
        return {
            id: cleanValue(a._id) || `adv-cloud-${idx}`,
            name: name,
            phone: String(fuzzyGet(a, ["Mobile", "Phone"])) || "",
            email: fuzzyGet(a, ["Email"]) || ""
        };
    }).filter(Boolean) as Advocate[];

    // 2. Extract unique Case Types from the Cases sheet
    const rawCases = result.cases || [];
    const typeNames = Array.from(new Set(rawCases.map((c: any) => 
        fuzzyGet(c, ["Case Type", "Type"]) || "General"
    )));
    
    const caseTypes: CaseType[] = typeNames.map(name => ({
        id: `ct-${String(name).toLowerCase().replace(/\s+/g, '-')}`,
        name: String(name)
    }));

    // 3. Process Cases
    const paymentsRaw = result.payments || [];
    const cases: Case[] = rawCases.map((c: any, idx: number) => {
        const caseNo = String(fuzzyGet(c, ["Case No", "Case Number"])) || `Row-${idx + 1}`;
        const advName = fuzzyGet(c, ["Advocate"]);
        const typeName = fuzzyGet(c, ["Case Type", "Type"]) || "General";
        
        const casePayments: FeePayment[] = paymentsRaw
            .filter((p: any) => String(fuzzyGet(p, ["Case No"])) === caseNo)
            .map((p: any, pIdx: number) => ({
                id: `pay-cloud-${caseNo}-${pIdx}`,
                amount: Number(fuzzyGet(p, ["Amount"])) || 0,
                date: safeDate(fuzzyGet(p, ["Paid Date", "Date"])),
                notes: fuzzyGet(p, ["Mode", "Notes"]) || ""
            }));

        const linkedAdvocate = advocates.find(a => a.name.toLowerCase() === String(advName).toLowerCase());
        const typeObj = caseTypes.find(t => t.name.toLowerCase() === String(typeName).toLowerCase());

        return {
            id: cleanValue(c._id) || `case-cloud-${caseNo}`,
            caseNumber: caseNo,
            caseTypeId: typeObj?.id || (caseTypes[0]?.id || "ct-general"),
            courtName: String(fuzzyGet(c, ["Court"])) || "Unspecified Court",
            nextHearingDate: safeDate(fuzzyGet(c, ["Next Hearing", "Hearing Date"])),
            courseOfAction: cleanValue(fuzzyGet(c, ["Course of Action", "_courseOfAction"])) || "No action recorded.",
            advocateId: cleanValue(c._advocateId) || linkedAdvocate?.id || "",
            caseDirection: (fuzzyGet(c, ["Case Direction", "_caseDirection"]) as CaseDirection) || 'Plaintiff',
            personAppearing: String(fuzzyGet(c, ["Person Appearing", "_personAppearing"])) || "",
            advocateComments: String(fuzzyGet(c, ["Remarks", "Comments", "_advocateComments"])) || "",
            feePayments: casePayments,
            createdAt: safeDate(fuzzyGet(c, ["Created Date", "Created"]))
        };
    });

    return { cases, advocates, caseTypes };
  } catch (error) {
    console.error("Cloud Load Failure:", error);
    return null;
  }
}
