/**
 * Pay Invoice Action
 *
 * Transitions invoice status from 'approved' to 'paid'.
 */

import { logger } from '../../../utils/logger.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublic } from '../types/index.js';
import type { InvoicePublic } from '../types/index.js';

export async function payInvoice(
  id: string,
  organizationId: string,
): Promise<InvoicePublic> {
  try {
    logger.info('Marking invoice as paid', { invoiceId: id, organizationId });

    const existing = await invoiceDb.findById(id, organizationId);
    if (!existing) throw new Error('Invoice not found');

    if (existing.status !== 'approved') {
      throw new Error(
        `Invoice cannot be marked as paid: current status is '${existing.status}'`,
      );
    }

    const invoice = await invoiceDb.update(id, organizationId, {
      status: 'paid',
    } as never);

    logger.info('Invoice marked as paid', { invoiceId: id });
    return toPublic(invoice);
  } catch (error) {
    logger.error('Error marking invoice as paid', { error: getErrorMessage(error) });
    throw error;
  }
}
