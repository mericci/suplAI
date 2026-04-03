import { backendClient, type ApiResponse } from '../client';
import type { Invoice } from '@supl/shared';

export async function getInvoice(
  orgId: string,
  invoiceId: string,
): Promise<ApiResponse<Invoice>> {
  return backendClient.get<ApiResponse<Invoice>>(
    `/api/organizations/${orgId}/invoices/${invoiceId}`,
  );
}
