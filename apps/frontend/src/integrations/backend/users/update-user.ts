import { backendClient, type ApiResponse } from '../client';
import type { User, UpdateUserPayload } from './types';

export async function updateUser(
  orgId: string,
  id: string,
  payload: UpdateUserPayload,
): Promise<ApiResponse<User>> {
  return backendClient.put<ApiResponse<User>>(
    `/api/organizations/${orgId}/users/${id}`,
    payload,
  );
}
