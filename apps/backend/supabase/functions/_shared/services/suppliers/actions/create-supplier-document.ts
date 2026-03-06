import { logger } from '../../../utils/logger.ts';
import * as supplierDocumentDb from '../../../db/supplier-document.db.ts';
import { validateCreateSupplierDocument } from '../../../db/schemas/supplier-document.schema.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { SupplierDocument, SupplierDocumentAmount } from '../../../types/supplier-document.ts';
import { toPublicDocument } from '../types/index.ts';

export async function createSupplierDocument(data: unknown): Promise<SupplierDocument> {
  try {
    const validated = validateCreateSupplierDocument(data);

    logger.info('Creating supplier document', {
      supplierId: validated.supplierId,
      fileName: validated.fileName,
    });

    const isCostDoc = !!(validated.tariffType || (validated.amounts && validated.amounts.length > 0));
    const documentRole = isCostDoc ? 'cost_contract' : 'additional';

    if (isCostDoc) {
      await supplierDocumentDb.demoteCurrentDocuments(validated.supplierId);
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
      document_role: documentRole,
      is_current: isCostDoc,
    });

    logger.info('Supplier document created', { docId: doc.id });
    return toPublicDocument(doc);
  } catch (error) {
    logger.error('Error creating supplier document', { error: getErrorMessage(error) });
    throw error;
  }
}
