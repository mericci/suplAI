interface Invoice {
  id: string;
  provider: string;
  documentType: string;
  documentTypeCode: number;
  period: string;
  amount: number;
  netAmount: number;
  taxAmount: number;
  grossAmount: number;
  status: string;
  issuerTaxIdentifier: string;
  issuerName: string;
  receiverTaxIdentifier: string;
  receiverName: string;
  documentNumber: string;
  issueDate: string;
  dueDate: string | null;
}

export type { Invoice };
