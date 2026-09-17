export interface Env {
  AIRTABLE_API_TOKEN: string;
  AIRTABLE_BASE_ID: string;
  WORKER_ADMIN_SECRET: string;
  TALLY_FORM_URL: string;
  AIRTABLE_TABLE_NAME: string;
  AIRTABLE_RFQ_TABLE_NAME: string;
  AIRTABLE_TIMEOUT_MS: string;
}
export type LinkStatus = "Active" | "Used" | "Expired" | "Revoked";
export interface AirtableRecord { id: string; fields: Record<string, unknown>; createdTime?: string; }
export interface Invitation {
  recordId: string; token: string; linkVersion: number; linkStatus: LinkStatus;
  expiresAt: string | null; releaseEligible: boolean; rfqId: string | null;
  rfqStatus: string | null; supplierId: string | null; supplierName: string | null;
  supplierPhone: string | null; resendCount: number;
}
export interface ValidationResult {
  valid: boolean; invitation: Invitation | null;
  reason: "valid"|"not_found"|"not_active"|"expired"|"not_release_eligible"|"rfq_closed"|"supplier_mismatch"|"internal_error";
  message: string;
}
export interface LogEntry { timestamp:string; tokenHash:string|null; result:"success"|"failure"; reason:string; linkStatus:string|null; invitationId:string|null; supplierId:string|null; rfqId:string|null; message:string; }
