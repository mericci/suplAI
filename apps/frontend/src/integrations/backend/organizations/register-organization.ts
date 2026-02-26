import { backendClient, type ApiResponse } from '../client';
import type { RegisterOrganizationPayload, RegisterOrganizationData } from './types';

export async function registerOrganization(
  payload: RegisterOrganizationPayload,
): Promise<ApiResponse<RegisterOrganizationData>> {
  return backendClient.post<ApiResponse<RegisterOrganizationData>>(
    '/api/organizations/register',
    payload,
  );
}
