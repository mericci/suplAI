import type { NominaWithInvoiceIds } from '@supl/shared';
import { backendClient, type ApiResponse } from '../client';

export async function updateNomina(
  orgId: string,
  nominaId: string,
  invoiceIds: string[],
): Promise<ApiResponse<NominaWithInvoiceIds>> {
  return backendClient.patch<ApiResponse<NominaWithInvoiceIds>>(
    `/api/organizations/${orgId}/nominas/${nominaId}`,
    { invoiceIds },
  );
}
