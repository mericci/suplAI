import type { NominaWithInvoiceIds } from '@supl/shared';
import { backendClient, type ApiResponse } from '../client';

export async function listNominas(
  orgId: string,
): Promise<ApiResponse<NominaWithInvoiceIds[]>> {
  return backendClient.get<ApiResponse<NominaWithInvoiceIds[]>>(
    `/api/organizations/${orgId}/nominas`,
  );
}
