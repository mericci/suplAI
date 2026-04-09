import type { SupplierService } from '@supl/shared';
import { backendClient, type ApiResponse } from '../client';

export async function listSupplierServices(
  supplierId: string,
  orgId: string,
): Promise<ApiResponse<SupplierService[]>> {
  return backendClient.get<ApiResponse<SupplierService[]>>(
    `/api/suppliers/${supplierId}/services?orgId=${orgId}`,
  );
}
