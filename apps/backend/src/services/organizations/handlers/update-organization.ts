import { updateOrganization as updateOrganizationAction } from '../actions/update-organization.js';
import type { OrganizationPublic } from '../types/index.js';

export async function updateOrganization(
  id: string,
  data: unknown,
): Promise<OrganizationPublic> {
  return updateOrganizationAction(id, data);
}
