import { backendClient } from '../../client';
import type { ApiResponse } from '../../client';
import type { AccountingIdWithAggregates, CreateAccountingIdPayload } from '../types';

export async function createAccountingId(
  orgId: string,
  payload: CreateAccountingIdPayload,
): Promise<ApiResponse<AccountingIdWithAggregates>> {
  return backendClient.post<ApiResponse<AccountingIdWithAggregates>>(
    `/api/organizations/${orgId}/accounting-ids`,
    payload,
  );
}
