import { backendClient } from '../client';
import type { ApiResponse } from '../client';

export type BudgetImpactStatus = 'within' | 'exceeds' | 'no_budget';

export interface InvoiceBudgetStatus {
  status: BudgetImpactStatus;
  budgetAmount: number;
  spentBefore: number;
}

export async function getInvoiceBudgetStatuses(
  orgId: string,
  invoiceIds: string[],
): Promise<ApiResponse<Record<string, InvoiceBudgetStatus>>> {
  if (invoiceIds.length === 0) return { success: true, data: {} };
  return backendClient.get<ApiResponse<Record<string, InvoiceBudgetStatus>>>(
    `/api/organizations/${orgId}/budget-items/invoice-statuses?invoiceIds=${invoiceIds.join(',')}`,
  );
}
