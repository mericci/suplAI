import { backendClient, type ApiResponse } from '../../client';
import type { PendingDistributionInvoice } from '../types';

export async function listPendingDistributions(
  orgId: string,
): Promise<ApiResponse<PendingDistributionInvoice[]>> {
  return backendClient.get<ApiResponse<PendingDistributionInvoice[]>>(
    `/api/organizations/${orgId}/invoices/pending-distributions`,
  );
}
