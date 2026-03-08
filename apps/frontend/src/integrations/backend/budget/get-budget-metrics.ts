import { backendClient } from '../client';
import type { ApiResponse } from '../client';
import type { BudgetMetrics } from './types';

export async function getBudgetMetrics(
  orgId: string,
): Promise<ApiResponse<BudgetMetrics>> {
  return backendClient.get<ApiResponse<BudgetMetrics>>(
    `/api/organizations/${orgId}/budget-items/metrics`,
  );
}
