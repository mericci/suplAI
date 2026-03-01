import { createOrganization as createOrganizationAction } from '../actions/create-organization.ts';
import type { OrganizationPublic } from '../types/index.ts';

export async function createOrganization(
  data: unknown,
): Promise<OrganizationPublic> {
  return createOrganizationAction(data);
}
