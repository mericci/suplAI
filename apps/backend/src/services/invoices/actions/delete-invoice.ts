/**
 * Delete Invoice Action (soft delete)
 */

import { logger } from '../../../utils/logger.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import { getErrorMessage } from '../../../utils/error.js';

export async function deleteInvoice(
  id: string,
  organizationId: string,
): Promise<void> {
  try {
    logger.info('Deleting invoice', { invoiceId: id, organizationId });

    const existing = await invoiceDb.findById(id, organizationId);
    if (!existing) throw new Error('Invoice not found');

    await invoiceDb.softDeleteById(id, organizationId);

    logger.info('Invoice soft-deleted', { invoiceId: id });
  } catch (error) {
    logger.error('Error deleting invoice', { error: getErrorMessage(error) });
    throw error;
  }
}
