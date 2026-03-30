import { backendClient, type ApiResponse } from '../client';
import type { SupplierCostCenterLink } from '../contabilidad/types';

export async function listSupplierCostCenters(
  orgId: string,
  supplierId: string,
): Promise<ApiResponse<SupplierCostCenterLink[]>> {
  return backendClient.get<ApiResponse<SupplierCostCenterLink[]>>(
    `/api/organizations/${orgId}/suppliers/${supplierId}/cost-centers`,
  );
}
