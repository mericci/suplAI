import { listPendingDistributions as listPendingDistributionsAction } from '../actions/list-pending-distributions.js';

export async function listPendingDistributions(
  organizationId: string,
): ReturnType<typeof listPendingDistributionsAction> {
  return listPendingDistributionsAction(organizationId);
}
