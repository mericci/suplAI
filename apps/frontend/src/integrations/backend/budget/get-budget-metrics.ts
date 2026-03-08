import { backendClient } from '../client';
import type { ApiResponse } from '../client';
import type { BudgetMetrics } from './types';

export async function getBudgetMetrics(
  orgId: string,
  budgetItemIds?: string[],
): Promise<ApiResponse<BudgetMetrics>> {
  const params = budgetItemIds && budgetItemIds.length > 0
    ? `?budgetItemIds=${budgetItemIds.join(',')}`
    : '';
  return backendClient.get<ApiResponse<BudgetMetrics>>(
    `/api/organizations/${orgId}/budget-items/metrics${params}`,
  );
}
