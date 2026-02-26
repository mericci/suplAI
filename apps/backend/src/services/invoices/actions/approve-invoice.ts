/**
 * Approve Invoice Action
 *
 * Transitions invoice status from 'pending' to 'approved'.
 * Records approvedByUserId and approvedAt timestamp.
 */

import { logger } from '../../../utils/logger.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublic } from '../types/index.js';
import type { InvoicePublic } from '../types/index.js';

export async function approveInvoice(
  id: string,
  organizationId: string,
  approvedByUserId: string,
): Promise<InvoicePublic> {
  try {
    logger.info('Approving invoice', {
      invoiceId: id,
      organizationId,
      approvedByUserId,
    });

    const existing = await invoiceDb.findById(id, organizationId);
    if (!existing) throw new Error('Invoice not found');

    if (existing.status !== 'pending') {
      throw new Error(
        `Invoice cannot be approved: current status is '${existing.status}'`,
      );
    }

    const invoice = await invoiceDb.update(id, organizationId, {
      status: 'approved',
      approved_by_user_id: approvedByUserId,
      approved_at: new Date().toISOString(),
    } as never);

    logger.info('Invoice approved', { invoiceId: id, approvedByUserId });
    return toPublic(invoice);
  } catch (error) {
    logger.error('Error approving invoice', { error: getErrorMessage(error) });
    throw error;
  }
}
