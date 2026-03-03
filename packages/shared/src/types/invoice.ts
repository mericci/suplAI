export interface Invoice {
  id: string;
  organizationId: string;
  supplierId: string;
  issuerTaxIdentifier: string;
  receiverTaxIdentifier: string;
  documentType: string;
  documentTypeNumber: number;
  documentNumber: string;
  issueDate: string;
  dueDate: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'paid';
  netAmount: number | null;
  taxAmount: number | null;
  grossAmount: number | null;
}
