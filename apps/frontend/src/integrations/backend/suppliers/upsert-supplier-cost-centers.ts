import { backendClient, type ApiResponse } from '../client';
import type { SupplierCostCenterLink, UpsertSupplierCostCentersPayload } from '../contabilidad/types';

export async function upsertSupplierCostCenters(
  orgId: string,
  supplierId: string,
  payload: UpsertSupplierCostCentersPayload,
): Promise<ApiResponse<SupplierCostCenterLink[]>> {
  return backendClient.post<ApiResponse<SupplierCostCenterLink[]>>(
    `/api/organizations/${orgId}/suppliers/${supplierId}/cost-centers`,
    payload,
  );
}
