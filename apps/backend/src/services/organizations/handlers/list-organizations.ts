import { listOrganizations as listOrganizationsAction } from '../actions/list-organizations.js';

export async function listOrganizations(
  filters: unknown,
): ReturnType<typeof listOrganizationsAction> {
  return listOrganizationsAction(filters);
}
