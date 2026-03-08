import { backendClient } from '../client';
import type { ApiResponse } from '../client';
import type { BudgetItemWithSpend, CreateBudgetItemPayload } from './types';

export async function createBudgetItem(
  orgId: string,
  payload: CreateBudgetItemPayload,
): Promise<ApiResponse<BudgetItemWithSpend>> {
  return backendClient.post<ApiResponse<BudgetItemWithSpend>>(
    `/api/organizations/${orgId}/budget-items`,
    payload,
  );
}
