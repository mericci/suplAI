import type { SupplierDocument } from '@supl/shared';
import { backendClient, type ApiResponse } from '../client';

export async function listSupplierDocuments(
  supplierId: string,
): Promise<ApiResponse<SupplierDocument[]>> {
  return backendClient.get<ApiResponse<SupplierDocument[]>>(
    `/api/suppliers/${supplierId}/documents`,
  );
}
