import { backendClient, type PaginatedResponse } from '../client';
import type { User } from './types';

export async function listUsers(
  page = 1,
  limit = 20,
): Promise<PaginatedResponse<User>> {
  return backendClient.get<PaginatedResponse<User>>(
    '/api/users',
    { page: String(page), limit: String(limit) },
  );
}
