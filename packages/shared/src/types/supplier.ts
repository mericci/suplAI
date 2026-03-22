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

export interface SupplierPaymentInfo {
  id: string;
  supplierId: string;
  organizationId: string;
  accountHolderName: string;
  taxIdentifier: string;
  bank: string;
  accountType: 'cuenta_corriente' | 'cuenta_vista' | 'cuenta_ahorro' | 'cuenta_rut';
  accountNumber: string;
  currency: 'CLP' | 'USD' | 'UF';
  email: string | null;
  createdAt: string;
  updatedAt: string;
}
