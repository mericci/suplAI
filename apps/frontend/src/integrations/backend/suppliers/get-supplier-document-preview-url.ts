import { backendClient, type ApiResponse } from '../client';

export async function getSupplierDocumentPreviewUrl(
  supplierId: string,
  docId: string,
): Promise<ApiResponse<{ signedUrl: string; fileName: string }>> {
  return backendClient.get<ApiResponse<{ signedUrl: string; fileName: string }>>(
    `/api/suppliers/${supplierId}/documents/${docId}/preview-url`,
  );
}
