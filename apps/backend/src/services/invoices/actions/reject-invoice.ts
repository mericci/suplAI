/**
 * Reject Invoice Action
 *
 * Transitions invoice status from 'pending' to 'rejected'.
 * Records approvedByUserId (the user who performed the rejection) and approvedAt timestamp.
 */

import { logger } from '../../../utils/logger.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublic } from '../types/index.js';
import type { InvoicePublic } from '../types/index.js';

export async function rejectInvoice(
  id: string,
  organizationId: string,
  rejectedByUserId: string,
): Promise<InvoicePublic> {
  try {
    logger.info('Rejecting invoice', {
      invoiceId: id,
      organizationId,
      rejectedByUserId,
    });

    const existing = await invoiceDb.findById(id, organizationId);
    if (!existing) throw new Error('Invoice not found');

    if (existing.status !== 'pending') {
      throw new Error(
        `Invoice cannot be rejected: current status is '${existing.status}'`,
      );
    }

    const invoice = await invoiceDb.update(id, organizationId, {
      status: 'rejected',
      approved_by_user_id: rejectedByUserId,
      approved_at: new Date().toISOString(),
    } as never);

    logger.info('Invoice rejected', { invoiceId: id, rejectedByUserId });
    return toPublic(invoice);
  } catch (error) {
    logger.error('Error rejecting invoice', { error: getErrorMessage(error) });
    throw error;
  }
}
