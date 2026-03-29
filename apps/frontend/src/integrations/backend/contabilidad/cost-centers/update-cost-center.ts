import { backendClient } from '../../client';
import type { ApiResponse } from '../../client';
import type { CostCenterDetail, UpdateCostCenterPayload } from '../types';

export async function updateCostCenter(
  orgId: string,
  id: string,
  payload: UpdateCostCenterPayload,
): Promise<ApiResponse<CostCenterDetail>> {
  return backendClient.put<ApiResponse<CostCenterDetail>>(
    `/api/organizations/${orgId}/cost-centers/${id}`,
    payload,
  );
}
