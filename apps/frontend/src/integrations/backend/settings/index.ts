import { backendClient, type ApiResponse } from '../client';
import type { OrganizationRule, UpsertOrganizationRulePayload } from '@supl/shared';

export async function getSettings(orgId: string): Promise<ApiResponse<OrganizationRule[]>> {
  return backendClient.get<ApiResponse<OrganizationRule[]>>(
    `/api/organizations/${orgId}/settings`,
  );
}

export async function updateSettings(
  orgId: string,
  rules: UpsertOrganizationRulePayload[],
): Promise<ApiResponse<OrganizationRule[]>> {
  return backendClient.put<ApiResponse<OrganizationRule[]>>(
    `/api/organizations/${orgId}/settings`,
    { rules },
  );
}

export async function getSupplierSettings(
  orgId: string,
  supplierId: string,
): Promise<ApiResponse<OrganizationRule[]>> {
  return backendClient.get<ApiResponse<OrganizationRule[]>>(
    `/api/organizations/${orgId}/settings/suppliers/${supplierId}`,
  );
}

export async function updateSupplierSettings(
  orgId: string,
  supplierId: string,
  rules: UpsertOrganizationRulePayload[],
): Promise<ApiResponse<OrganizationRule[]>> {
  return backendClient.put<ApiResponse<OrganizationRule[]>>(
    `/api/organizations/${orgId}/settings/suppliers/${supplierId}`,
    { rules },
  );
}
