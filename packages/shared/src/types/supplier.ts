export interface Supplier {
  id: string;
  legalName: string;
  taxIdentifier: string;
  totalInvoiceAmount: number;
  totalApprovedAmount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
