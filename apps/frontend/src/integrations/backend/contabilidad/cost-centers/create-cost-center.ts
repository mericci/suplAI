import { backendClient } from '../../client';
import type { ApiResponse } from '../../client';
import type { CostCenterDetail, CreateCostCenterPayload } from '../types';

export async function createCostCenter(
  orgId: string,
  payload: CreateCostCenterPayload,
): Promise<ApiResponse<CostCenterDetail>> {
  return backendClient.post<ApiResponse<CostCenterDetail>>(
    `/api/organizations/${orgId}/cost-centers`,
    payload,
  );
}
