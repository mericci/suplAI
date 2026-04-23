import { backendClient, type ApiResponse } from '../client';
import type { Rendicion } from './types';

export async function createRendicion(
  orgId: string,
  body: { userPaymentInfoId: string; name: string },
): Promise<ApiResponse<Rendicion>> {
  return backendClient.post<ApiResponse<Rendicion>>(
    `/api/organizations/${orgId}/rendiciones`,
    body,
  );
}
