/**
 * Get Invoice Action
 */

import { logger } from '../../../utils/logger.ts';
import * as invoiceDb from '../../../db/invoice.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { toPublic } from '../types/index.ts';
import type { InvoicePublic } from '../types/index.ts';

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
