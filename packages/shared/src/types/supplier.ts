export interface Supplier {
  id: string;
  legalName: string;
  taxIdentifier: string;
  totalInvoiceAmount: number;
  totalApprovedAmount: number;
  respaldoType: 'none' | 'manual_insight' | 'validated_document';
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
