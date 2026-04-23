import { backendClient, type ApiResponse } from '../client';

export async function getRendicionDocumentPreviewUrl(
  orgId: string,
  rendicionId: string,
  docId: string,
): Promise<ApiResponse<{ signedUrl: string; fileName: string }>> {
  return backendClient.get<ApiResponse<{ signedUrl: string; fileName: string }>>(
    `/api/organizations/${orgId}/rendiciones/${rendicionId}/documents/${docId}/preview`,
  );
}
