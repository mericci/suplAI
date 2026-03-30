import { backendClient, type ApiResponse } from '../client';

export async function deleteSupplierCostCenter(
  orgId: string,
  supplierId: string,
  id: string,
): Promise<ApiResponse<{ deleted: boolean }>> {
  return backendClient.del<ApiResponse<{ deleted: boolean }>>(
    `/api/organizations/${orgId}/suppliers/${supplierId}/cost-centers/${id}`,
  );
}
