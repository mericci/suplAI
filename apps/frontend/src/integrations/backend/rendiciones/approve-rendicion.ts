import { backendClient, type ApiResponse } from '../client';
import type { Rendicion } from './types';

export async function approveRendicion(
  orgId: string,
  rendicionId: string,
  aiValidated = true,
): Promise<ApiResponse<Rendicion>> {
  return backendClient.patch<ApiResponse<Rendicion>>(
    `/api/organizations/${orgId}/rendiciones/${rendicionId}/approve`,
    { aiValidated },
  );
}
