import { backendClient, type ApiResponse } from '../client';
import type { Rendicion } from './types';

export interface DocumentCorrection {
  documentId: string;
  correctedAmount: number;
}

export async function rejectRendicion(
  orgId: string,
  rendicionId: string,
  body: { rejectionNotes: string; documentCorrections?: DocumentCorrection[] },
): Promise<ApiResponse<Rendicion>> {
  return backendClient.patch<ApiResponse<Rendicion>>(
    `/api/organizations/${orgId}/rendiciones/${rendicionId}/reject`,
    body,
  );
}
