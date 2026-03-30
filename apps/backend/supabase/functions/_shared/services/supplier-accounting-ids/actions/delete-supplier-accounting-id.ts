import * as db from '../../../db/supplier-accounting-id.db.ts';

export async function deleteSupplierAccountingId(id: string, organizationId: string): Promise<void> {
  await db.softDeleteById(id, organizationId);
}
