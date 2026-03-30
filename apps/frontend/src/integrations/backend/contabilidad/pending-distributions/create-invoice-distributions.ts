import { backendClient, type ApiResponse } from '../../client';
import type { CreateInvoiceDistributionsPayload } from '../types';

export async function createInvoiceDistributions(
  orgId: string,
  invoiceId: string,
  payload: CreateInvoiceDistributionsPayload,
): Promise<ApiResponse<{ created: boolean }>> {
  return backendClient.post<ApiResponse<{ created: boolean }>>(
    `/api/organizations/${orgId}/invoices/${invoiceId}/distributions`,
    payload,
  );
}
