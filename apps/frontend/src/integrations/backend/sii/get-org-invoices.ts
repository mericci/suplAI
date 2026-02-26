import { backendClient, type ApiResponse, type PaginatedResponse } from '../client';
import { buildQueryString } from '@/helpers';
import type { Invoice } from './types';

export interface GetOrgInvoicesParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'approved' | 'rejected';
  supplierId?: string;
  issuedAfter?: string;
  issuedBefore?: string;
}

export async function getOrgInvoices(
  orgId: string,
  params?: GetOrgInvoicesParams,
): Promise<ApiResponse<PaginatedResponse<Invoice>>> {
  const queryString = buildQueryString({ ...params });
  return backendClient.get<ApiResponse<PaginatedResponse<Invoice>>>(
    `/api/organizations/${orgId}/invoices?${queryString}`,
  );
}
