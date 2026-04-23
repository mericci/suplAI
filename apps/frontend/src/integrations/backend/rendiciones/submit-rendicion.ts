import { backendClient, type ApiResponse } from '../client';
import type { Rendicion } from './types';

export async function submitRendicion(
  orgId: string,
  rendicionId: string,
  body: { submissionNotes: string },
): Promise<ApiResponse<Rendicion>> {
  return backendClient.patch<ApiResponse<Rendicion>>(
    `/api/organizations/${orgId}/rendiciones/${rendicionId}/submit`,
    body,
  );
}
