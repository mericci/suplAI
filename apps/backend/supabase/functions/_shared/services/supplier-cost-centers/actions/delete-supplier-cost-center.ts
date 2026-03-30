import * as db from '../../../db/supplier-cost-center.db.ts';

export async function deleteSupplierCostCenter(
  id: string,
  organizationId: string,
): Promise<void> {
  await db.softDeleteById(id, organizationId);
}
