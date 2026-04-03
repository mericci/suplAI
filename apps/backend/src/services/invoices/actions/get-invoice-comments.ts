/**
 * Get Invoice Comments Action
 */

import { logger } from '../../../utils/logger.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import * as commentDb from '../../../db/invoice-comment.db.js';
import type { InvoiceCommentRow } from '../../../db/invoice-comment.db.js';
import { getErrorMessage } from '../../../utils/error.js';

export async function getInvoiceComments(
  id: string,
  organizationId: string,
): Promise<InvoiceCommentRow[]> {
  try {
    const existing = await invoiceDb.findById(id, organizationId);
    if (!existing) throw new Error('Invoice not found');

    return commentDb.findCommentsByInvoiceId(id, organizationId);
  } catch (error) {
    logger.error('Error getting invoice comments', { error: getErrorMessage(error) });
    throw error;
  }
}
