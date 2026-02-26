import { backendClient, type ApiResponse } from '../client';
import type { Invoice } from '@supl/shared';

export async function approveInvoice(
  orgId: string,
  invoiceId: string,
): Promise<ApiResponse<Invoice>> {
  return backendClient.patch<ApiResponse<Invoice>>(
    `/api/organizations/${orgId}/invoices/${invoiceId}/approve`,
    {},
  );
}
