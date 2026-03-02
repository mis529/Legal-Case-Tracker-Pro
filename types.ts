
export interface CaseType {
  id: string;
  name: string;
}

export type CaseDirection = 'Plaintiff' | 'Defendant';

export interface FeePayment {
  id: string;
  amount: number;
  date: string; // ISO string format
  notes?: string;
}

export interface Advocate {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface CaseDocument {
  name: string;
  url: string;
}

export interface Case {
  id:string;
  partyName: string;
  caseTypeId: string;
  courtName: string;
  nextHearingDate: string; // ISO string format
  courseOfAction: string;
  advocateId: string;
  caseDirection: CaseDirection;
  personAppearing: string;
  advocateComments: string;
  feePayments: FeePayment[];
  documentUrls?: CaseDocument[]; // Links to uploaded files in Google Drive
  status: 'Ongoing' | 'Closed - Win' | 'Closed - Loss';
  createdAt: string; // ISO string format
}
