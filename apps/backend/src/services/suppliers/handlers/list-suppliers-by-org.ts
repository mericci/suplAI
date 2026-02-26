import { listSuppliersByOrg as listSuppliersByOrgAction } from '../actions/list-suppliers-by-org.js';

export async function listSuppliersByOrg(
  organizationId: string,
  filters: unknown,
): ReturnType<typeof listSuppliersByOrgAction> {
  return listSuppliersByOrgAction(organizationId, filters);
}
