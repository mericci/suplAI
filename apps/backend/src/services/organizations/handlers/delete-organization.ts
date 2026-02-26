import { deleteOrganization as deleteOrganizationAction } from '../actions/delete-organization.js';

export async function deleteOrganization(id: string): Promise<void> {
  return deleteOrganizationAction(id);
}
