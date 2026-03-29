import { backendClient } from '../../client';
import type { ApiResponse } from '../../client';
import type { AccountingIdWithAggregates, ContabilidadPeriod } from '../types';

export async function listAccountingIds(
  orgId: string,
  period: ContabilidadPeriod = 'current_month',
): Promise<ApiResponse<AccountingIdWithAggregates[]>> {
  return backendClient.get<ApiResponse<AccountingIdWithAggregates[]>>(
    `/api/organizations/${orgId}/accounting-ids?period=${period}`,
  );
}
