import { backendClient, type ApiResponse } from '../client';
import type { Rendicion } from './types';

export async function getRendicion(
  orgId: string,
  rendicionId: string,
): Promise<ApiResponse<Rendicion>> {
  return backendClient.get<ApiResponse<Rendicion>>(
    `/api/organizations/${orgId}/rendiciones/${rendicionId}`,
  );
}
