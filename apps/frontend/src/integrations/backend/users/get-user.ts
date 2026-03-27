import { backendClient, type ApiResponse } from '../client';
import type { User } from './types';

export async function getUser(orgId: string, id: string): Promise<ApiResponse<User>> {
  return backendClient.get<ApiResponse<User>>(`/api/organizations/${orgId}/users/${id}`);
}
