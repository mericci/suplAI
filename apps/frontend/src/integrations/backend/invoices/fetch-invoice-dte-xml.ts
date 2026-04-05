import type { Invoice } from '@supl/shared';
import { backendClient, type ApiResponse } from '../client';

export async function fetchInvoiceDteXml(
  orgId: string,
  invoiceId: string,
): Promise<ApiResponse<Invoice>> {
  return backendClient.patch<ApiResponse<Invoice>>(
    `/api/organizations/${orgId}/invoices/${invoiceId}/fetch-dte-xml`,
    {},
  );
}
