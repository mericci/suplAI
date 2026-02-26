export interface Invoice {
  id: string;
  organizationId: string;
  supplierId: string;
  issuerTaxIdentifier: string;
  receiverTaxIdentifier: string;
  documentType: string;
  documentNumber: string;
  issueDate: string;
  dueDate: string | null;
  status: 'pending' | 'approved' | 'rejected';
  netAmount: number | null;
  taxAmount: number | null;
  grossAmount: number | null;
}
