import { backendClient } from '../../client';
import type { ApiResponse } from '../../client';

export async function deleteCostCenter(
  orgId: string,
  id: string,
): Promise<ApiResponse<null>> {
  return backendClient.del<ApiResponse<null>>(
    `/api/organizations/${orgId}/cost-centers/${id}`,
  );
}
