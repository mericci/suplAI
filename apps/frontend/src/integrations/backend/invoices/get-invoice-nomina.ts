import { backendClient, type ApiResponse } from '../client';
import type { NominaWithInvoiceIds } from '@supl/shared';

export async function getInvoiceNomina(
  orgId: string,
  invoiceId: string,
): Promise<ApiResponse<NominaWithInvoiceIds | null>> {
  return backendClient.get<ApiResponse<NominaWithInvoiceIds | null>>(
    `/api/organizations/${orgId}/invoices/${invoiceId}/nomina`,
  );
}
