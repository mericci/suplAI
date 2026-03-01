import { deleteOrganization as deleteOrganizationAction } from '../actions/delete-organization.ts';

export async function deleteOrganization(id: string): Promise<void> {
  return deleteOrganizationAction(id);
}
