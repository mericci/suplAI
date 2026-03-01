import { getOrganization as getOrganizationAction } from '../actions/get-organization.ts';
import type {
  OrganizationPublic,
  OrganizationSearchParams,
} from '../types/index.ts';

export async function getOrganization(
  params: OrganizationSearchParams,
): Promise<OrganizationPublic> {
  return getOrganizationAction(params);
}
