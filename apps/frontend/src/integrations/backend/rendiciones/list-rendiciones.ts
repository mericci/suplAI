import { backendClient, type ApiResponse } from '../client';
import type { RendicionListResponse } from './types';

export async function listRendiciones(
  orgId: string,
  params?: { page?: number; status?: string; viewAll?: boolean },
): Promise<ApiResponse<RendicionListResponse>> {
  const search = new URLSearchParams();
  if (params?.page) search.set('page', String(params.page));
  if (params?.status) search.set('status', params.status);
  if (params?.viewAll) search.set('viewAll', 'true');
  const qs = search.toString();
  return backendClient.get<ApiResponse<RendicionListResponse>>(
    `/api/organizations/${orgId}/rendiciones${qs ? `?${qs}` : ''}`,
  );
}
