import { backendClient, type ApiResponse } from '../client';
import { buildQueryString } from '@/helpers';
import type { Invoice, GetSiiInvoicesParams } from './types';

export async function getSiiInvoices(
  params: GetSiiInvoicesParams,
): Promise<ApiResponse<{ invoices: Invoice[] }>> {
  const queryString = buildQueryString({ ...params });

  return backendClient.get<ApiResponse<{ invoices: Invoice[] }>>(
    `/api/sii/invoices?${queryString}`,
  );
}
