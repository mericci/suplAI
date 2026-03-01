import { updateOrganization as updateOrganizationAction } from '../actions/update-organization.ts';
import type { OrganizationPublic } from '../types/index.ts';

export async function updateOrganization(
  id: string,
  data: unknown,
): Promise<OrganizationPublic> {
  return updateOrganizationAction(id, data);
}
