
import { Case, Advocate, CaseType, FeePayment, CaseDirection } from '../types';

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzExvIQYIRie4-NB3UVqjpZyuXlDEpONI8OBjTSr7TdsxZXRBvlE-4tR23gBUaWOW1O/exec";

function cleanValue(val: any): any {
  if (typeof val === 'string') {
    return val.replace(/^"|"$/g, '').replace(/\\"/g, '"').trim();
  }
  return val;
}

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

function safeDate(dateStr: any): string {
  const cleaned = cleanValue(dateStr);
  if (!cleaned) return new Date().toISOString();
  const d = new Date(cleaned);
  return isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
}

export async function syncToGoogleSheets(data: {
  cases: Case[],
  advocates: Advocate[],
  caseTypes: CaseType[],
  courtNames: string[]
}) {
  try {
    // 1. Gather all unique Case Type names from Master List AND actual Cases
    const allCaseTypeNames = new Set<string>();
    data.caseTypes.forEach(t => allCaseTypeNames.add(t.name.trim()));
    data.cases.forEach(c => {
        const typeObj = data.caseTypes.find(t => t.id === c.caseTypeId);
        if (typeObj) allCaseTypeNames.add(typeObj.name.trim());
    });
    const finalCaseTypes = Array.from(allCaseTypeNames).filter(Boolean).sort();

    // 2. Gather all unique Court Names from Master List AND actual Cases
    const allCourtNames = new Set<string>();
    data.courtNames.forEach(c => allCourtNames.add(c.trim()));
    data.cases.forEach(c => {
        if (c.courtName) allCourtNames.add(c.courtName.trim());
    });
    const finalCourtNames = Array.from(allCourtNames).filter(Boolean).sort();

    // 3. Prepare the "Type" sheet payload (Aligning Col A: Case Type, Col B: Court Name)
    const maxLength = Math.max(finalCaseTypes.length, finalCourtNames.length);
    const typesPayload = [];
    
    for (let i = 0; i < maxLength; i++) {
        const row: Record<string, string> = {
            "Case Type": finalCaseTypes[i] || "",
            "Court Name": finalCourtNames[i] || ""
        };
        if (row["Case Type"] || row["Court Name"]) {
            typesPayload.push(row);
        }
    }

    const payload = JSON.stringify({
      cases: data.cases.map(c => ({
        "Party Name": c.partyName,
        "Court": c.courtName,
        "Case Type": data.caseTypes.find(t => t.id === c.caseTypeId)?.name || "Other",
        "Advocate": data.advocates.find(a => a.id === c.advocateId)?.name || "Unassigned",
        "Next Hearing": c.nextHearingDate,
        "Remarks": c.advocateComments,
        "Status": c.status,
        "Closing Date": c.closingDate || "",
        "Document URL": (c.documentUrls || []).map(d => `${d.name}|${d.url}`).join(', '),
        "Created Date": c.createdAt,
        "_id": c.id,
        "_advocateId": c.advocateId,
        "_caseDirection": c.caseDirection,
        "_status": c.status,
        "_closingDate": c.closingDate || "",
        "_courseOfAction": c.courseOfAction,
        "_personAppearing": c.personAppearing,
        "_documentUrls": (c.documentUrls || []).map(d => `${d.name}|${d.url}`).join(', ')
      })),
      advocates: data.advocates.map(adv => ({
        "Advocate Name": adv.name,
        "Mobile": adv.phone || "",
        "Email": adv.email || "", // FIXED: Added Email field here
        "_id": adv.id
      })),
      payments: data.cases.flatMap(c => c.feePayments.map(p => {
        const advObj = data.advocates.find(a => a.id === c.advocateId);
        return {
          "Party Name": c.partyName,
          "Advocate": advObj?.name || "Unknown",
          "Amount": p.amount,
          "Paid Date": p.date,
          "Mode": p.notes || ""
        };
      })),
      types: typesPayload, // This updates the "Type" sheet specifically
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

export async function uploadFileToDrive(file: File, partyName: string): Promise<{ name: string, url: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = (reader.result as string).split(',')[1];
        const fileName = `${partyName}_${file.name}`;
        const payload = {
          action: "upload",
          fileName: fileName,
          mimeType: file.type,
          data: base64,
          folderId: "1_w95EC53rQCz5m8G2_OfH4xlWA1hfqnV"
        };

        const response = await fetch(GOOGLE_SCRIPT_URL, {
          method: "POST",
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`);
        }

        const text = await response.text();
        let result;
        try {
          result = JSON.parse(text);
        } catch (e) {
          console.error("Failed to parse response:", text);
          throw new Error("Invalid response format from server");
        }
        
        if (result.status === "success") {
          resolve({ name: file.name, url: result.url });
        } else {
          reject(new Error(result.message || "Upload failed on server"));
        }
      } catch (error: any) {
        console.error("Upload error details:", error);
        reject(new Error(error.message || "Network error during upload"));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export async function loadFromGoogleSheets() {
  try {
    const response = await fetch(`${GOOGLE_SCRIPT_URL}?t=${Date.now()}`, {
        method: 'GET',
        cache: 'no-cache',
        redirect: 'follow'
    });

    if (!response.ok) throw new Error(`Google Script returned HTTP ${response.status}`);
    
    let text = await response.text();
    if (text.includes('}{')) {
        text = text.split('}{')[0] + '}';
    }

    let result;
    try {
        result = JSON.parse(text);
    } catch (e) {
        console.error("Failed to parse cloud JSON", e);
        return null;
    }

    if (!result) return null;

    const advocates: Advocate[] = (result.advocates || []).map((a: any, idx: number) => {
        const name = fuzzyGet(a, ["Advocate Name", "Advocate", "Name"]) || "Unknown Advocate";
        if (name === "" || name === '""') return null;
        return {
            id: cleanValue(a._id) || `adv-cloud-${idx}`,
            name: name,
            phone: String(fuzzyGet(a, ["Mobile", "Phone"])) || "",
            email: fuzzyGet(a, ["Email"]) || ""
        };
    }).filter(Boolean) as Advocate[];

    const cloudTypesRows = result.types || [];
    
    // Extract unique case types and court names from the Type sheet columns
    const extractedCaseTypeNames = Array.from(new Set(
        cloudTypesRows.map((t: any) => fuzzyGet(t, ["Case Type"])).filter(Boolean)
    )) as string[];
    
    const extractedCourtNames = Array.from(new Set(
        cloudTypesRows.map((t: any) => fuzzyGet(t, ["Court Name"])).filter(Boolean)
    )) as string[];

    const caseTypes: CaseType[] = extractedCaseTypeNames.map((name, idx) => ({
        id: `ct-${idx}-${name.toLowerCase().replace(/\s+/g, '-')}`,
        name: name
    }));

    const paymentsRaw = result.payments || [];
    const rawCases = result.cases || [];
    const cases: Case[] = rawCases.map((c: any, idx: number) => {
        const partyName = String(fuzzyGet(c, ["Party Name", "Person Name", "Case No", "Case Number"])) || `Row-${idx + 1}`;
        const advName = fuzzyGet(c, ["Advocate"]);
        const typeName = fuzzyGet(c, ["Case Type", "Type"]) || "General";
        
        const casePayments: FeePayment[] = paymentsRaw
            .filter((p: any) => String(fuzzyGet(p, ["Party Name", "Case No"])) === partyName)
            .map((p: any, pIdx: number) => ({
                id: `pay-cloud-${partyName}-${pIdx}`,
                amount: Number(fuzzyGet(p, ["Amount"])) || 0,
                date: safeDate(fuzzyGet(p, ["Paid Date", "Date"])),
                notes: fuzzyGet(p, ["Mode", "Notes"]) || ""
            }));

        const linkedAdvocate = advocates.find(a => a.name.toLowerCase() === String(advName).toLowerCase());
        const typeObj = caseTypes.find(t => t.name.toLowerCase() === String(typeName).toLowerCase());

        return {
            id: cleanValue(c._id) || `case-cloud-${partyName}`,
            partyName: partyName,
            caseTypeId: typeObj?.id || (caseTypes.length > 0 ? caseTypes[0].id : "ct-general"),
            courtName: String(fuzzyGet(c, ["Court"])) || "Unspecified Court",
            nextHearingDate: safeDate(fuzzyGet(c, ["Next Hearing", "Hearing Date"])),
            courseOfAction: cleanValue(fuzzyGet(c, ["Course of Action", "_courseOfAction"])) || "No action recorded.",
            advocateId: cleanValue(c._advocateId) || linkedAdvocate?.id || "",
            caseDirection: (fuzzyGet(c, ["Case Direction", "_caseDirection"]) as CaseDirection) || 'Plaintiff',
            status: (fuzzyGet(c, ["Status", "_status"]) as any) || 'Ongoing',
            closingDate: cleanValue(fuzzyGet(c, ["Closing Date", "_closingDate"])) || undefined,
            personAppearing: String(fuzzyGet(c, ["Person Appearing", "_personAppearing"])) || "",
            advocateComments: String(fuzzyGet(c, ["Remarks", "Comments", "_advocateComments"])) || "",
            feePayments: casePayments,
            documentUrls: (cleanValue(fuzzyGet(c, ["Document URL", "_documentUrls", "_documentUrl"])) || "")
                .split(',')
                .map((s: string) => {
                    const parts = s.trim().split('|');
                    if (parts.length >= 2) {
                        return { name: parts[0], url: parts.slice(1).join('|') };
                    } else if (s.trim()) {
                        return { name: "Document", url: s.trim() };
                    }
                    return null;
                })
                .filter(Boolean) as any[],
            createdAt: safeDate(fuzzyGet(c, ["Created Date", "Created"]))
        };
    });

    return { 
        cases, 
        advocates, 
        caseTypes: caseTypes.length > 0 ? caseTypes : null,
        courtNames: extractedCourtNames.length > 0 ? extractedCourtNames : null
    };
  } catch (error) {
    console.error("Cloud Load Failure:", error);
    return null;
  }
}
