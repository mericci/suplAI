import { backendClient, type ApiResponse } from '../client';
import { buildQueryString } from '@/helpers';
import type { Invoice } from './types';

export interface GetMyOrgSiiInvoicesParams {
  from: string;
  to?: string;
}

export async function getMyOrgSiiInvoices(
  params: GetMyOrgSiiInvoicesParams,
): Promise<ApiResponse<{ invoices: Invoice[] }>> {
  const queryString = buildQueryString({ ...params });

  return backendClient.get<ApiResponse<{ invoices: Invoice[] }>>(
    `/api/sii/invoices/me?${queryString}`,
  );
}
