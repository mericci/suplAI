import { backendClient, type PaginatedResponse } from '../client';
import buildQueryString from '@/helpers/build-query-string';
import type { Supplier } from './types';

export interface ListSuppliersParams {
  page?: number;
  limit?: number;
  search?: string;
  taxIdentifier?: string;
}

export async function listSuppliers(
  params?: ListSuppliersParams,
): Promise<PaginatedResponse<Supplier>> {
  const queryString = buildQueryString({ ...params });
  return backendClient.get<PaginatedResponse<Supplier>>(
    `/api/suppliers?${queryString}`,
  );
}
