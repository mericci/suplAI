import { backendClient } from '../../client';
import type { ApiResponse } from '../../client';
import type { AccountingIdWithAggregates, UpdateAccountingIdPayload } from '../types';

export async function updateAccountingId(
  orgId: string,
  id: string,
  payload: UpdateAccountingIdPayload,
): Promise<ApiResponse<AccountingIdWithAggregates>> {
  return backendClient.put<ApiResponse<AccountingIdWithAggregates>>(
    `/api/organizations/${orgId}/accounting-ids/${id}`,
    payload,
  );
}
