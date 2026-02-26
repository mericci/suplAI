/**
 * Get Supplier Action
 */

import { logger } from '../../../utils/logger.js';
import * as supplierDb from '../../../db/supplier.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublic } from '../types/index.js';
import type { SupplierPublic, SupplierSearchParams } from '../types/index.js';

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
