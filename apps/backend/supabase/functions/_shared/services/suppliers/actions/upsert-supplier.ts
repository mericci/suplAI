/**
 * Upsert Supplier Action
 *
 * Find-or-create pattern: if a supplier with the given taxIdentifier exists,
 * update its legalName; otherwise create a new record.
 * This ensures global deduplication without DB-level upsert constraints on partial indexes.
 */

import { logger } from '../../../utils/logger.ts';
import * as supplierDb from '../../../db/supplier.db.ts';
import { validateUpsertSupplier } from '../../../db/schemas/index.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { normalizeRut } from '../../../utils/rut.ts';
import { toPublic } from '../types/index.ts';
import type { SupplierPublic } from '../types/index.ts';

export async function upsertSupplier(data: unknown): Promise<SupplierPublic> {
  try {
    const validated = validateUpsertSupplier(data);
    const taxIdentifier = normalizeRut(validated.taxIdentifier);

    logger.info('Upserting supplier', { taxIdentifier });

    const existing = await supplierDb.findByTaxIdentifier(taxIdentifier);

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
      tax_identifier: taxIdentifier,
    });

    logger.info('Supplier created (upsert)', { supplierId: supplier.id });
    return toPublic(supplier);
  } catch (error) {
    logger.error('Error upserting supplier', { error: getErrorMessage(error) });
    throw error;
  }
}
