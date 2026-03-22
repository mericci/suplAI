import { backendClient, type ApiResponse } from '../client';

export async function deleteNomina(
  orgId: string,
  nominaId: string,
): Promise<ApiResponse<null>> {
  return backendClient.del<ApiResponse<null>>(
    `/api/organizations/${orgId}/nominas/${nominaId}`,
  );
}
