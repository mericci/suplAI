import { createOrganization as createOrganizationAction } from '../actions/create-organization.js';
import type { OrganizationPublic } from '../types/index.js';

export async function createOrganization(
  data: unknown,
): Promise<OrganizationPublic> {
  return createOrganizationAction(data);
}
