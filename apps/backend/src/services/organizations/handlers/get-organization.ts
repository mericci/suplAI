import { getOrganization as getOrganizationAction } from '../actions/get-organization.js';
import type {
  OrganizationPublic,
  OrganizationSearchParams,
} from '../types/index.js';

export async function getOrganization(
  params: OrganizationSearchParams,
): Promise<OrganizationPublic> {
  return getOrganizationAction(params);
}
