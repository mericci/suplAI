import { backendClient, type ApiResponse } from '../client';
import type { Organization } from '@supl/shared';

export async function getOrganization(
  orgId: string,
): Promise<ApiResponse<Organization>> {
  return backendClient.get<ApiResponse<Organization>>(
    `/api/organizations/${orgId}`,
  );
}
