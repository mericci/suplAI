import { backendClient, type ApiResponse } from '../client';
import type { User, CreateUserPayload } from './types';

export async function createUser(
  orgId: string,
  payload: CreateUserPayload,
): Promise<ApiResponse<User>> {
  return backendClient.post<ApiResponse<User>>(
    `/api/organizations/${orgId}/users`,
    payload,
  );
}
