import { backendClient, type ApiResponse } from '../client';
import type { UploadDocumentResult } from './types';

export async function uploadRendicionDocument(
  orgId: string,
  rendicionId: string,
  file: File,
): Promise<ApiResponse<UploadDocumentResult>> {
  const formData = new FormData();
  formData.append('file', file);
  return backendClient.postFormData<ApiResponse<UploadDocumentResult>>(
    `/api/organizations/${orgId}/rendiciones/${rendicionId}/documents`,
    formData,
  );
}
