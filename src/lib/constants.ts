export const TRACK_TYPE_LABELS: Record<string, string> = {
  prime: "Prime",
  fixed_unlinked: "Fixed Unlinked",
  fixed_linked: "Fixed Linked",
  variable_every_5: "Variable Every 5 Years",
  variable_every_year: "Variable Every Year",
  variable_linked: "Variable Linked",
  other: "Other",
};

export const STATUS_LABELS: Record<string, string> = {
  initial_inquiry: "Initial Inquiry",
  in_progress: "In Progress",
  offer_received: "Offer Received",
  approved: "Approved",
  rejected: "Rejected",
  signed: "Signed",
  cancelled: "Cancelled",
};

export const STATUS_COLORS: Record<string, string> = {
  initial_inquiry: "bg-gray-100 text-gray-800",
  in_progress: "bg-blue-100 text-blue-800",
  offer_received: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  signed: "bg-purple-100 text-purple-800",
  cancelled: "bg-gray-100 text-gray-500",
};

export interface BankInfo {
  name: string;
  parent: string | null;
  note?: string;
}

export const ISRAELI_BANKS_DATA: BankInfo[] = [
  { name: "בנק לאומי", parent: null },
  { name: "בנק הפועלים", parent: null },
  { name: "בנק דיסקונט", parent: null },
  { name: "בנק מרכנתיל דיסקונט", parent: "בנק דיסקונט" },
  { name: "בנק מזרחי-טפחות", parent: null, note: "מיזוג עם טפחות ב-2005, רכש את בנק איגוד ב-2020" },
  { name: "בנק יהב", parent: "בנק מזרחי-טפחות", note: "משכנתאות דרך מזרחי-טפחות" },
  { name: "הבנק הבינלאומי הראשון", parent: null, note: "מיזג את בנק אוצר החייל" },
  { name: "בנק מסד", parent: "הבנק הבינלאומי הראשון" },
  { name: "בנק ירושלים", parent: null },
];

export const ISRAELI_BANKS = ISRAELI_BANKS_DATA.map((b) => b.name);

export function getBankInfo(bankName: string): BankInfo | undefined {
  return ISRAELI_BANKS_DATA.find((b) => b.name === bankName);
}

export function getBankParent(bankName: string): string | null {
  return getBankInfo(bankName)?.parent ?? null;
}

export function getBankChildren(parentName: string): BankInfo[] {
  return ISRAELI_BANKS_DATA.filter((b) => b.parent === parentName);
}

export function getParentBanks(): BankInfo[] {
  return ISRAELI_BANKS_DATA.filter((b) => b.parent === null);
}

export const TRACK_TYPES = [
  "prime",
  "fixed_unlinked",
  "fixed_linked",
  "variable_every_5",
  "variable_every_year",
  "variable_linked",
  "other",
] as const;

export const REQUEST_STATUSES = [
  "initial_inquiry",
  "in_progress",
  "offer_received",
  "approved",
  "rejected",
  "signed",
  "cancelled",
] as const;

export const loanStatusLabels: Record<string, string> = {
  pending: "Pending",
  approved: "Approved",
  received: "Received",
  repaying: "Repaying",
  completed: "Completed",
};

export const loanStatusColors: Record<string, string> = {
  pending: "gray",
  approved: "blue",
  received: "green",
  repaying: "yellow",
  completed: "purple",
};

export const costCategoryLabels: Record<string, string> = {
  lawyer: "Lawyer",
  purchase_tax: "Purchase Tax",
  renovation: "Renovation",
  broker: "Mortgage Broker",
  appraisal: "Appraisal",
  moving: "Moving",
  insurance: "Insurance",
  other: "Other",
};

export const costPaymentStatusLabels: Record<string, string> = {
  unpaid: "Unpaid",
  partially_paid: "Partially Paid",
  fully_paid: "Fully Paid",
};

export const costPaymentStatusColors: Record<string, string> = {
  unpaid: "red",
  partially_paid: "yellow",
  fully_paid: "green",
};

export const milestoneTypePresets: Record<string, string> = {
  contract_signing: "Contract Signing",
  payment_30_days: "30-Day Payment",
  payment_60_days: "60-Day Payment",
  key_handover: "Key Handover",
  mortgage_start: "Mortgage Start",
  custom: "Custom",
};
