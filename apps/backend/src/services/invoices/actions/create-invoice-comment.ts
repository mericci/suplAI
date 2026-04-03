/**
 * Create Invoice Comment Action
 */

import { logger } from '../../../utils/logger.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import * as commentDb from '../../../db/invoice-comment.db.js';
import type { InvoiceCommentRow } from '../../../db/invoice-comment.db.js';
import { getErrorMessage } from '../../../utils/error.js';

export async function createInvoiceComment(
  invoiceId: string,
  organizationId: string,
  userId: string,
  content: string,
  type: 'comment' | 'rejection' = 'comment',
): Promise<InvoiceCommentRow> {
  try {
    const existing = await invoiceDb.findById(invoiceId, organizationId);
    if (!existing) throw new Error('Invoice not found');

    return commentDb.createComment({
      invoice_id: invoiceId,
      organization_id: organizationId,
      user_id: userId,
      content,
      type,
    });
  } catch (error) {
    logger.error('Error creating invoice comment', { error: getErrorMessage(error) });
    throw error;
  }
}
