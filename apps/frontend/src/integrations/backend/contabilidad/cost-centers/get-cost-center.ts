import { backendClient } from '../../client';
import type { ApiResponse } from '../../client';
import type { CostCenterDetail } from '../types';

export async function getCostCenter(
  orgId: string,
  id: string,
): Promise<ApiResponse<CostCenterDetail>> {
  return backendClient.get<ApiResponse<CostCenterDetail>>(
    `/api/organizations/${orgId}/cost-centers/${id}`,
  );
}
