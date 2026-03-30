import { backendClient, type ApiResponse } from '../client';
import type { SupplierAccountingIdLink, UpsertSupplierAccountingIdsPayload } from '../contabilidad/types';

export async function upsertSupplierAccountingIds(
  orgId: string,
  supplierId: string,
  payload: UpsertSupplierAccountingIdsPayload,
): Promise<ApiResponse<SupplierAccountingIdLink[]>> {
  return backendClient.post<ApiResponse<SupplierAccountingIdLink[]>>(
    `/api/organizations/${orgId}/suppliers/${supplierId}/accounting-ids`,
    payload,
  );
}
