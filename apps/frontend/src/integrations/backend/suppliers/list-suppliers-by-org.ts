import { backendClient, type PaginatedResponse } from '../client';
import buildQueryString from '@/helpers/build-query-string';
import type { Supplier } from './types';

export interface ListSuppliersByOrgParams {
  page?: number;
  limit?: number;
  search?: string;
}

export async function listSuppliersByOrg(
  orgId: string,
  params?: ListSuppliersByOrgParams,
): Promise<PaginatedResponse<Supplier>> {
  const queryString = buildQueryString({ ...params });
  return backendClient.get<PaginatedResponse<Supplier>>(
    `/api/organizations/${orgId}/suppliers?${queryString}`,
  );
}
