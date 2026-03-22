export type NominaStatus = 'pending' | 'paid';

export interface Nomina {
  id: string;
  organizationId: string;
  createdByUserId: string;
  status: NominaStatus;
  totalAmount: number;
  invoiceCount: number;
  voucherStoragePath: string | null;
  voucherStorageBucket: string | null;
  paidAt: string | null;
  paidByUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NominaWithInvoiceIds extends Nomina {
  invoiceIds: string[];
}
