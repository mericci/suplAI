import type { ExtractedDocumentData } from '@supl/shared';
import { backendClient, type ApiResponse } from '../client';

export async function extractSupplierDocument(
  file: File,
): Promise<ApiResponse<ExtractedDocumentData>> {
  const formData = new FormData();
  formData.append('file', file);
  return backendClient.postFormData<ApiResponse<ExtractedDocumentData>>(
    '/api/suppliers/extract-from-document',
    formData,
  );
}
