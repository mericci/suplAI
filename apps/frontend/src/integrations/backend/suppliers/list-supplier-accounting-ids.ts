import { backendClient, type ApiResponse } from '../client';
import type { SupplierAccountingIdLink } from '../contabilidad/types';

export async function listSupplierAccountingIds(
  orgId: string,
  supplierId: string,
): Promise<ApiResponse<SupplierAccountingIdLink[]>> {
  return backendClient.get<ApiResponse<SupplierAccountingIdLink[]>>(
    `/api/organizations/${orgId}/suppliers/${supplierId}/accounting-ids`,
  );
}
