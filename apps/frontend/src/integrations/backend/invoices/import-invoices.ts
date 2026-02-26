import { backendClient, type ApiResponse } from '../client';

export interface ImportInvoicesPayload {
  from: string;
  defaultStatus: 'pending' | 'approved' | 'rejected';
}

export async function importInvoices(
  orgId: string,
  payload: ImportInvoicesPayload,
): Promise<ApiResponse<{ count: number; message: string }>> {
  return backendClient.post(`/api/organizations/${orgId}/invoices/import`, payload);
}
