import { backendClient } from '../client';
import type { ApiResponse } from '../client';
import type { BudgetItemWithSpend, BudgetPeriod } from './types';

export async function listBudgetItems(
  orgId: string,
  period: BudgetPeriod = 'current_month',
): Promise<ApiResponse<BudgetItemWithSpend[]>> {
  return backendClient.get<ApiResponse<BudgetItemWithSpend[]>>(
    `/api/organizations/${orgId}/budget-items?period=${period}`,
  );
}
