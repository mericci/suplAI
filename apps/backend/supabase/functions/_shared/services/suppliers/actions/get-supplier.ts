/**
 * Get Supplier Action
 */

import { logger } from '../../../utils/logger.ts';
import * as supplierDb from '../../../db/supplier.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { toPublic } from '../types/index.ts';
import type { SupplierPublic, SupplierSearchParams } from '../types/index.ts';

export async function getSupplier(
  params: SupplierSearchParams,
): Promise<SupplierPublic> {
  try {
    logger.info('Getting supplier', { params });

    let supplier = null;

    if (params.id) {
      supplier = await supplierDb.findById(params.id);
    } else if (params.taxIdentifier) {
      supplier = await supplierDb.findByTaxIdentifier(params.taxIdentifier);
    } else {
      throw new Error(
        'No valid search criteria provided: id or taxIdentifier is required',
      );
    }

    if (!supplier) throw new Error('Supplier not found');

    return toPublic(supplier);
  } catch (error) {
    logger.error('Error getting supplier', { error: getErrorMessage(error) });
    throw error;
  }
}
