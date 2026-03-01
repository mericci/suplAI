/**
 * Update Supplier Action
 */

import { logger } from '../../../utils/logger.ts';
import * as supplierDb from '../../../db/supplier.db.ts';
import { validateUpdateSupplier } from '../../../db/schemas/index.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { toPublic } from '../types/index.ts';
import type { SupplierPublic } from '../types/index.ts';

export async function updateSupplier(
  id: string,
  data: unknown,
): Promise<SupplierPublic> {
  try {
    const validated = validateUpdateSupplier(data);

    logger.info('Updating supplier', { supplierId: id });

    const existing = await supplierDb.findById(id);
    if (!existing) throw new Error('Supplier not found');

    if (
      validated.taxIdentifier
      && validated.taxIdentifier !== existing.tax_identifier
    ) {
      const conflict = await supplierDb.findByTaxIdentifier(
        validated.taxIdentifier,
      );
      if (conflict) throw new Error('A supplier with this tax identifier already exists');
    }

    const updates: Record<string, unknown> = {};
    if (validated.legalName !== undefined) updates.legal_name = validated.legalName;
    if (validated.taxIdentifier !== undefined) updates.tax_identifier = validated.taxIdentifier;

    const supplier = await supplierDb.update(id, updates as never);

    logger.info('Supplier updated', { supplierId: id });
    return toPublic(supplier);
  } catch (error) {
    logger.error('Error updating supplier', { error: getErrorMessage(error) });
    throw error;
  }
}
