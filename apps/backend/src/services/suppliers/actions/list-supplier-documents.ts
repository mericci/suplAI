/**
 * List Supplier Documents Action
 *
 * Returns all active documents associated with a supplier.
 */

import type { SupplierDocument } from '@supl/shared';
import { logger } from '../../../utils/logger.js';
import * as supplierDocumentDb from '../../../db/supplier-document.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublicDocument } from '../types/index.js';

export async function listSupplierDocuments(supplierId: string): Promise<SupplierDocument[]> {
  try {
    logger.info('Listing supplier documents', { supplierId });
    const docs = await supplierDocumentDb.findBySupplier(supplierId);
    return docs.map(toPublicDocument);
  } catch (error) {
    logger.error('Error listing supplier documents', { error: getErrorMessage(error) });
    throw error;
  }
}
