/**
 * Get Invoice Action
 */

import { logger } from '../../../utils/logger.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublic } from '../types/index.js';
import type { InvoicePublic } from '../types/index.js';

export async function getInvoice(
  id: string,
  organizationId: string,
): Promise<InvoicePublic> {
  try {
    logger.info('Getting invoice', { invoiceId: id, organizationId });

    const invoice = await invoiceDb.findById(id, organizationId);
    if (!invoice) throw new Error('Invoice not found');

    return toPublic(invoice);
  } catch (error) {
    logger.error('Error getting invoice', { error: getErrorMessage(error) });
    throw error;
  }
}
