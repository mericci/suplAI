/**
 * Delete Supplier Action (soft delete)
 */

import { logger } from '../../../utils/logger.ts';
import * as supplierDb from '../../../db/supplier.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';

export async function deleteSupplier(id: string): Promise<void> {
  try {
    logger.info('Deleting supplier', { supplierId: id });

    const existing = await supplierDb.findById(id);
    if (!existing) throw new Error('Supplier not found');

    await supplierDb.softDeleteById(id);

    logger.info('Supplier soft-deleted', { supplierId: id });
  } catch (error) {
    logger.error('Error deleting supplier', { error: getErrorMessage(error) });
    throw error;
  }
}
