/**
 * Approve Invoice Action
 *
 * Transitions invoice status from 'pending' to 'approved'.
 * Records approvedByUserId and approvedAt timestamp.
 */

import { logger } from '../../../utils/logger.ts';
import * as invoiceDb from '../../../db/invoice.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { toPublic } from '../types/index.ts';
import type { InvoicePublic } from '../types/index.ts';

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
