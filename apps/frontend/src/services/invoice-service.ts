import { backendClient } from '@/integrations/backend/client';
import type { ApiResponse } from '@/integrations/backend/client';

export async function syncInvoices(
  orgId: string,
): Promise<ApiResponse<{ message: string }>> {
  return backendClient.post<ApiResponse<{ message: string }>>(
    `/api/organizations/${orgId}/invoices/sync`,
  );
}
