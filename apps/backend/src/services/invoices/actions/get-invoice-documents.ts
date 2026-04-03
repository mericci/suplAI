/**
 * Get Invoice Documents Action
 */

import { logger } from '../../../utils/logger.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import * as docDb from '../../../db/invoice-document.db.js';
import type { InvoiceDocumentRow } from '../../../db/invoice-document.db.js';
import { getErrorMessage } from '../../../utils/error.js';

export async function getInvoiceDocuments(
  id: string,
  organizationId: string,
): Promise<InvoiceDocumentRow[]> {
  try {
    const existing = await invoiceDb.findById(id, organizationId);
    if (!existing) throw new Error('Invoice not found');

    return docDb.findDocumentsByInvoiceId(id, organizationId);
  } catch (error) {
    logger.error('Error getting invoice documents', { error: getErrorMessage(error) });
    throw error;
  }
}
