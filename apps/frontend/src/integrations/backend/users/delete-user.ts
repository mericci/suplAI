import { backendClient } from '../client';

export async function deleteUser(id: string): Promise<void> {
  return backendClient.del<void>(`/api/users/${id}`);
}
