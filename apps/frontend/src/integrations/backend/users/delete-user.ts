import { backendClient } from '../client';

export async function deleteUser(orgId: string, id: string): Promise<void> {
  return backendClient.del<void>(`/api/organizations/${orgId}/users/${id}`);
}
