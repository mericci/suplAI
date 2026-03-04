import { logger } from '../../../utils/logger.ts';
import * as supplierDocumentDb from '../../../db/supplier-document.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { SupplierDocument } from '../../../types/supplier-document.ts';
import { toPublicDocument } from '../types/index.ts';

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
