import { backendClient, type ApiResponse } from '../client';

export async function getLockedInvoiceIds(
  orgId: string,
): Promise<ApiResponse<string[]>> {
  return backendClient.get<ApiResponse<string[]>>(
    `/api/organizations/${orgId}/nominas/locked-invoice-ids`,
  );
}
