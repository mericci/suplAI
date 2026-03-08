import { backendClient, type ApiResponse, type PaginatedResponse } from '../client';
import type { User } from './types';

export async function listUsers(
  orgId: string,
  page = 1,
  limit = 20,
): Promise<ApiResponse<PaginatedResponse<User>>> {
  return backendClient.get<ApiResponse<PaginatedResponse<User>>>(
    `/api/organizations/${orgId}/users`,
    { page: String(page), limit: String(limit) },
  );
}
