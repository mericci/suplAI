import { backendClient } from '../../client';
import type { ApiResponse } from '../../client';
import type { CostCenterWithAggregates, ContabilidadPeriod } from '../types';

export async function listCostCenters(
  orgId: string,
  period: ContabilidadPeriod = 'current_month',
): Promise<ApiResponse<CostCenterWithAggregates[]>> {
  return backendClient.get<ApiResponse<CostCenterWithAggregates[]>>(
    `/api/organizations/${orgId}/cost-centers?period=${period}`,
  );
}
