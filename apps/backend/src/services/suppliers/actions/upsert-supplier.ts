/**
 * Upsert Supplier Action
 *
 * Find-or-create pattern: if a supplier with the given taxIdentifier exists,
 * update its legalName; otherwise create a new record.
 * This ensures global deduplication without DB-level upsert constraints on partial indexes.
 */

import { logger } from '../../../utils/logger.js';
import * as supplierDb from '../../../db/supplier.db.js';
import { validateUpsertSupplier } from '../../../db/schemas/index.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublic } from '../types/index.js';
import type { SupplierPublic } from '../types/index.js';

export async function upsertSupplier(data: unknown): Promise<SupplierPublic> {
  try {
    const validated = validateUpsertSupplier(data);

    logger.info('Upserting supplier', {
      taxIdentifier: validated.taxIdentifier,
    });

    const existing = await supplierDb.findByTaxIdentifier(
      validated.taxIdentifier,
    );

    if (existing) {
      // Update legalName in case it changed
      const updated = await supplierDb.update(existing.id, {
        legal_name: validated.legalName,
      });
      logger.info('Supplier updated (upsert)', { supplierId: existing.id });
      return toPublic(updated);
    }

    const supplier = await supplierDb.create({
      legal_name: validated.legalName,
      tax_identifier: validated.taxIdentifier,
    });

    logger.info('Supplier created (upsert)', { supplierId: supplier.id });
    return toPublic(supplier);
  } catch (error) {
    logger.error('Error upserting supplier', { error: getErrorMessage(error) });
    throw error;
  }
}
