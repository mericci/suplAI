import { backendClient, type ApiResponse } from '../client';
import type { User, UpdateUserPayload } from './types';

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<ApiResponse<User>> {
  return backendClient.put<ApiResponse<User>>(`/api/users/${id}`, payload);
}
