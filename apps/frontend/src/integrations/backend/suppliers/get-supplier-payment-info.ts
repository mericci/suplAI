import type { SupplierPaymentInfo } from '@supl/shared';
import { backendClient, type ApiResponse } from '../client';

export async function getSupplierPaymentInfo(
  orgId: string,
  supplierId: string,
): Promise<ApiResponse<SupplierPaymentInfo | null>> {
  return backendClient.get<ApiResponse<SupplierPaymentInfo | null>>(
    `/api/organizations/${orgId}/suppliers/${supplierId}/payment-info`,
  );
}
