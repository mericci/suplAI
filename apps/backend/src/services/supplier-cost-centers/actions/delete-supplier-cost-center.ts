import * as db from '../../../db/supplier-cost-center.db.js';
import { getErrorMessage } from '../../../utils/error.js';

export async function deleteSupplierCostCenter(
  id: string,
  organizationId: string,
): Promise<void> {
  try {
    await db.softDeleteById(id, organizationId);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
