
import { Case, Advocate, CaseType, FeePayment, CaseDirection } from '../types';

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbzExvIQYIRie4-NB3UVqjpZyuXlDEpONI8OBjTSr7TdsxZXRBvlE-4tR23gBUaWOW1O/exec";

/**
 * SYNC DATA TO GOOGLE SHEETS
 */
export async function syncToGoogleSheets(data: {
  cases: Case[],
  advocates: Advocate[],
  caseTypes: CaseType[]
}) {
  try {
    // 1. Map Advocates: Advocate Name, Mobile, Fee Type, Total Fees Paid, Pending
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
        "Pending": 0 
      };
    });

    // 2. Map Cases: Case No, Court, Case Type, Department, Advocate, Next Hearing, Remarks, Created Date
    const preparedCases = data.cases.map(c => {
      const typeObj = data.caseTypes.find(t => t.id === c.caseTypeId);
      const advObj = data.advocates.find(a => a.id === c.advocateId);
      
      return {
        "Case No": c.caseNumber,
        "Court": c.courtName,
        "Case Type": typeObj?.name || "Other",
        "Department": typeObj?.name || "Legal",
        "Advocate": advObj?.name || "Unassigned",
        "Next Hearing": new Date(c.nextHearingDate).toISOString().split('T')[0],
        "Remarks": c.advocateComments || "",
        "Created Date": new Date(c.createdAt).toISOString().split('T')[0],
        // Internal metadata for re-loading
        "_id": c.id,
        "_advocateId": c.advocateId,
        "_caseDirection": c.caseDirection,
        "_courseOfAction": c.courseOfAction,
        "_personAppearing": c.personAppearing
      };
    });

    // 3. Map Payments (into your 'CaseTypes' sheet): Case No, Advocate, Amount, Paid Date, Mode
    const allPayments: any[] = [];
    data.cases.forEach(c => {
      const advObj = data.advocates.find(a => a.id === c.advocateId);
      c.feePayments.forEach(p => {
        allPayments.push({
          "Case No": c.caseNumber,
          "Advocate": advObj?.name || "Unknown",
          "Amount": p.amount,
          "Paid Date": new Date(p.date).toISOString().split('T')[0],
          "Mode": p.notes?.toLowerCase().includes("cash") ? "Cash" : "Online"
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

    // 1. Process Advocates
    const advocates: Advocate[] = (result.advocates || []).map((a: any, idx: number) => ({
        id: a._id || `adv-cloud-${idx}`,
        name: a["Advocate Name"] || "Unknown",
        phone: a["Mobile"] || "",
        email: a.email || ""
    }));

    // 2. Process Payments (from the 'payments' or 'CaseTypes' data)
    const paymentsRaw = result.payments || [];
    
    // 3. Process Cases & Link Payments
    const cases: Case[] = (result.cases || []).map((c: any, idx: number) => {
        const caseNo = c["Case No"];
        
        // Find matching payments for this case
        const casePayments: FeePayment[] = paymentsRaw
            .filter((p: any) => p["Case No"] === caseNo)
            .map((p: any, pIdx: number) => ({
                id: `pay-cloud-${idx}-${pIdx}`,
                amount: Number(p["Amount"]) || 0,
                date: p["Paid Date"] ? new Date(p["Paid Date"]).toISOString() : new Date().toISOString(),
                notes: p["Mode"] || ""
            }));

        return {
            id: c._id || `case-cloud-${idx}`,
            caseNumber: caseNo || "N/A",
            caseTypeId: `ct-${c["Case Type"]}`, // Temporary grouping by name
            courtName: c["Court"] || "",
            nextHearingDate: c["Next Hearing"] ? new Date(c["Next Hearing"]).toISOString() : new Date().toISOString(),
            courseOfAction: c._courseOfAction || "",
            advocateId: c._advocateId || (advocates.find(a => a.name === c["Advocate"])?.id || ""),
            caseDirection: (c._caseDirection as CaseDirection) || 'Plaintiff',
            personAppearing: c._personAppearing || "",
            advocateComments: c["Remarks"] || "",
            feePayments: casePayments,
            createdAt: c["Created Date"] ? new Date(c["Created Date"]).toISOString() : new Date().toISOString()
        };
    });

    // 4. Derive unique Case Types from the data
    const uniqueTypes = Array.from(new Set(cases.map(c => {
        const matchingRaw = result.cases.find((rc: any) => rc["Case No"] === c.caseNumber);
        return matchingRaw ? matchingRaw["Case Type"] : "Other";
    })));
    
    const caseTypes: CaseType[] = uniqueTypes.map(name => ({
        id: `ct-${name}`,
        name: name
    }));

    return { cases, advocates, caseTypes };
  } catch (error) {
    console.warn("Cloud Load: Failed.", error);
    return null;
  }
}
