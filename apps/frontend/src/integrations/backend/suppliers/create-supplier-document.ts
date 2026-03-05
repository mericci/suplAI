import type { SupplierDocument } from '@supl/shared';
import { backendClient, type ApiResponse } from '../client';

export interface CreateSupplierDocumentPayload {
  fileName: string;
  storagePath: string;
  storageBucket?: string;
  documentType?: string | null;
  serviceCategory?: string | null;
  serviceDescription?: string | null;
  tariffType?: string | null;
  tariffDetail?: string | null;
  amounts?: Array<{ amount: number; currency: string; concept: string; frequency: string }>;
}

export async function createSupplierDocument(
  supplierId: string,
  payload: CreateSupplierDocumentPayload,
): Promise<ApiResponse<SupplierDocument>> {
  return backendClient.post<ApiResponse<SupplierDocument>>(
    `/api/suppliers/${supplierId}/documents`,
    payload,
  );
}
