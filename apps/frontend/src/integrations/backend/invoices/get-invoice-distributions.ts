import { backendClient, type ApiResponse } from '../client';

export interface CostCenterDistribution {
  id: string;
  invoice_id: string;
  cost_center_id: string;
  organization_id: string;
  amount: number;
  percentage: number | null;
  created_at: string;
  updated_at: string;
}

export interface AccountingIdDistribution {
  id: string;
  invoice_id: string;
  accounting_id: string;
  organization_id: string;
  amount: number;
  percentage: number | null;
  created_at: string;
  updated_at: string;
}

export interface InvoiceDistributions {
  costCenters: CostCenterDistribution[];
  accountingIds: AccountingIdDistribution[];
}

export async function getInvoiceDistributions(
  orgId: string,
  invoiceId: string,
): Promise<ApiResponse<InvoiceDistributions>> {
  return backendClient.get<ApiResponse<InvoiceDistributions>>(
    `/api/organizations/${orgId}/invoices/${invoiceId}/distributions`,
  );
}
