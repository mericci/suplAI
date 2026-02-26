import { backendClient } from '../client';
import type { ApiResponse } from '../client';
import type { Supplier } from './types';

export interface UpsertSupplierPayload {
  legalName: string;
  taxIdentifier: string;
}

export async function upsertSupplier(
  payload: UpsertSupplierPayload,
): Promise<ApiResponse<Supplier>> {
  return backendClient.post<ApiResponse<Supplier>>(
    '/api/suppliers/upsert',
    payload,
  );
}
