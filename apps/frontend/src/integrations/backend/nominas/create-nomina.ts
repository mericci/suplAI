import type { NominaWithInvoiceIds } from '@supl/shared';
import { backendClient, type ApiResponse } from '../client';

export interface CreateNominaPayload {
  invoiceIds?: string[];
}

export async function createNomina(
  orgId: string,
  payload: CreateNominaPayload = {},
): Promise<ApiResponse<NominaWithInvoiceIds>> {
  return backendClient.post<ApiResponse<NominaWithInvoiceIds>>(
    `/api/organizations/${orgId}/nominas`,
    payload,
  );
}
