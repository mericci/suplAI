import { backendClient, type ApiResponse } from '../client';
import type { Supplier } from './types';

export async function getSupplier(supplierId: string): Promise<ApiResponse<Supplier>> {
  return backendClient.get<ApiResponse<Supplier>>(`/api/suppliers/${supplierId}`);
}
