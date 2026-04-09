/**
 * Create Supplier Document Action
 *
 * Validates and persists a supplier document record.
 */

import type { SupplierDocument, SupplierDocumentAmount } from '@supl/shared';
import { logger } from '../../../utils/logger.js';
import * as supplierDocumentDb from '../../../db/supplier-document.db.js';
import { validateCreateSupplierDocument } from '../../../db/schemas/supplier-document.schema.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublicDocument } from '../types/index.js';

export async function createSupplierDocument(data: unknown): Promise<SupplierDocument> {
  try {
    const validated = validateCreateSupplierDocument(data);

    logger.info('Creating supplier document', {
      supplierId: validated.supplierId,
      fileName: validated.fileName,
    });

    const documentRole = validated.documentRole ?? 'cost_contract';
    const isCostDoc = documentRole === 'cost_contract';

    if (isCostDoc && validated.serviceId) {
      await supplierDocumentDb.demoteCurrentDocuments(validated.supplierId, validated.serviceId);
    }

    const doc = await supplierDocumentDb.create({
      supplier_id: validated.supplierId,
      file_name: validated.fileName,
      storage_path: validated.storagePath,
      storage_bucket: validated.storageBucket,
      document_type: validated.documentType,
      service_category: validated.serviceCategory,
      service_description: validated.serviceDescription,
      tariff_type: validated.tariffType,
      tariff_detail: validated.tariffDetail,
      amounts: (validated.amounts ?? []) as SupplierDocumentAmount[],
      service_id: validated.serviceId ?? null,
      document_role: documentRole,
      is_current: isCostDoc && !!validated.serviceId,
    });

    logger.info('Supplier document created', { docId: doc.id });
    return toPublicDocument(doc);
  } catch (error) {
    logger.error('Error creating supplier document', { error: getErrorMessage(error) });
    throw error;
  }
}
