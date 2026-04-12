export interface Invoice {
  id: string;
  organizationId: string;
  supplierId: string;
  serviceId: string | null;
  issuerTaxIdentifier: string;
  receiverTaxIdentifier: string;
  documentType: string;
  documentTypeNumber: number;
  documentNumber: string;
  issueDate: string;
  dueDate: string | null;
  executiveTitleDate: string;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  approvedByUserId: string | null;
  approvedAt: string | null;
  paidAt: string | null;
  netAmount: number | null;
  taxAmount: number | null;
  grossAmount: number | null;
  aiValidationStatus: 'ok' | 'error' | null;
  aiValidationNotes: string | null;
  dteXml: string | null;
}
