
import { Case, Advocate, CaseType, FeePayment, CaseDirection } from '../types';

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzExvIQYIRie4-NB3UVqjpZyuXlDEpONI8OBjTSr7TdsxZXRBvlE-4tR23gBUaWOW1O/exec";

/**
 * HELPER: Clean keys from Google Sheets (trim and handle common variations)
 */
function getVal(obj: any, keys: string[]) {
  const normalizedObj: any = {};
  Object.keys(obj).forEach(k => {
    normalizedObj[k.trim().toLowerCase()] = obj[k];
  });
  
  for (const key of keys) {
    const cleanKey = key.toLowerCase();
    if (normalizedObj[cleanKey] !== undefined) return normalizedObj[cleanKey];
  }
  return undefined;
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
    const preparedAdvocates = data.advocates.map(adv => {
      const advocateCases = data.cases.filter(c => c.advocateId === adv.id);
      const totalFeesPaid = advocateCases.reduce((sum, c) => 
        sum + c.feePayments.reduce((pSum, p) => pSum + p.amount, 0), 0
      );

      return {
        "Advocate Name": adv.name,
        "Mobile": adv.phone || "",
        "Fee Type": "Standard",
        "Total Fees Paid": totalFeesPaid,
        "Pending": 0,
        "_id": adv.id // Keep internal ID
      };
    });

    const preparedCases = data.cases.map(c => {
      const typeObj = data.caseTypes.find(t => t.id === c.caseTypeId);
      const advObj = data.advocates.find(a => a.id === c.advocateId);
      
      return {
        "Case No": c.caseNumber,
        "Court": c.courtName,
        "Case Type": typeObj?.name || "Other",
        "Department": typeObj?.name || "General",
        "Advocate": advObj?.name || "Unassigned",
        "Next Hearing": new Date(c.nextHearingDate).toISOString().split('T')[0],
        "Remarks": c.advocateComments || "",
        "Created Date": new Date(c.createdAt).toISOString().split('T')[0],
        "_id": c.id,
        "_advocateId": c.advocateId,
        "_caseDirection": c.caseDirection,
        "_courseOfAction": c.courseOfAction,
        "_personAppearing": c.personAppearing
      };
    });

    const allPayments: any[] = [];
    data.cases.forEach(c => {
      const advObj = data.advocates.find(a => a.id === c.advocateId);
      c.feePayments.forEach(p => {
        allPayments.push({
          "Case No": c.caseNumber,
          "Advocate": advObj?.name || "Unknown",
          "Amount": p.amount,
          "Paid Date": new Date(p.date).toISOString().split('T')[0],
          "Mode": p.notes || "Online"
        });
      });
    });

    const payload = JSON.stringify({
      cases: preparedCases,
      advocates: preparedAdvocates,
      payments: allPayments,
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
    console.error("Cloud Sync Failure:", error);
    throw error;
  }
}

/**
 * LOAD DATA FROM GOOGLE SHEETS
 */
export async function loadFromGoogleSheets() {
  try {
    const response = await fetch(GOOGLE_SCRIPT_URL, {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'follow'
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const text = await response.text();
    const result = JSON.parse(text);

    if (!result || !result.cases) return null;

    // 1. Process Advocates first so we can link them to cases
    const advocates: Advocate[] = (result.advocates || []).map((a: any, idx: number) => {
        const name = getVal(a, ["Advocate Name", "Advocate", "Name"]) || "Unknown";
        return {
            id: a._id || `adv-cloud-${name.replace(/\s+/g, '-')}`,
            name: name,
            phone: String(getVal(a, ["Mobile", "Phone", "Mobile No"])) || "",
            email: a.email || ""
        };
    });

    // 2. Extract unique Case Types to populate dropdowns
    const rawCases = result.cases || [];
    const typeNames = Array.from(new Set(rawCases.map((c: any) => getVal(c, ["Case Type", "Type"]) || "Other")));
    const caseTypes: CaseType[] = typeNames.map(name => ({
        id: `ct-${String(name).replace(/\s+/g, '-').toLowerCase()}`,
        name: String(name)
    }));

    // 3. Process Payments
    const paymentsRaw = result.payments || [];
    
    // 4. Process Cases
    const cases: Case[] = rawCases.map((c: any, idx: number) => {
        const caseNo = String(getVal(c, ["Case No", "Case Number", "No"])) || `TEMP-${idx}`;
        const advName = getVal(c, ["Advocate"]);
        const typeName = getVal(c, ["Case Type", "Type"]) || "Other";
        
        // Find matching payments
        const casePayments: FeePayment[] = paymentsRaw
            .filter((p: any) => String(getVal(p, ["Case No"])) === caseNo)
            .map((p: any, pIdx: number) => ({
                id: `pay-cloud-${caseNo}-${pIdx}`,
                amount: Number(getVal(p, ["Amount"])) || 0,
                date: getVal(p, ["Paid Date", "Date"]) ? new Date(getVal(p, ["Paid Date", "Date"])).toISOString() : new Date().toISOString(),
                notes: getVal(p, ["Mode", "Remarks", "Notes"]) || ""
            }));

        // Link to existing advocate by name if ID missing
        const linkedAdvocate = advocates.find(a => a.name === advName);
        const typeObj = caseTypes.find(t => t.name === typeName);

        return {
            id: c._id || `case-cloud-${caseNo}`,
            caseNumber: caseNo,
            caseTypeId: typeObj?.id || caseTypes[0]?.id || "ct-other",
            courtName: String(getVal(c, ["Court", "Court Name"])) || "",
            nextHearingDate: getVal(c, ["Next Hearing", "Hearing Date"]) ? new Date(getVal(c, ["Next Hearing", "Hearing Date"])).toISOString() : new Date().toISOString(),
            courseOfAction: c._courseOfAction || "No details provided.",
            advocateId: c._advocateId || linkedAdvocate?.id || "",
            caseDirection: (c._caseDirection as CaseDirection) || 'Plaintiff',
            personAppearing: String(getVal(c, ["Person Appearing"])) || "",
            advocateComments: String(getVal(c, ["Remarks", "Comments"])) || "",
            feePayments: casePayments,
            createdAt: getVal(c, ["Created Date", "Created"]) ? new Date(getVal(c, ["Created Date", "Created"])).toISOString() : new Date().toISOString()
        };
    });

    return { cases, advocates, caseTypes };
  } catch (error) {
    console.warn("Cloud Load: Failed.", error);
    return null;
  }
}
