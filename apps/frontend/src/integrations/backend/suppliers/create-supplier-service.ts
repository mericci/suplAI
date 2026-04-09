import type { SupplierService } from '@supl/shared';
import { backendClient, type ApiResponse } from '../client';

export interface CreateSupplierServicePayload {
  organizationId: string;
  serviceCategory: string;
  serviceDescription?: string | null;
}

export async function createSupplierService(
  supplierId: string,
  payload: CreateSupplierServicePayload,
): Promise<ApiResponse<SupplierService>> {
  return backendClient.post<ApiResponse<SupplierService>>(
    `/api/suppliers/${supplierId}/services`,
    payload,
  );
}
