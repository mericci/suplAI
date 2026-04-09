/**
 * List Supplier Services Action
 *
 * Returns all active services for a supplier within an organization.
 */

import type { SupplierService } from '@supl/shared';
import { logger } from '../../../utils/logger.js';
import * as supplierServiceDb from '../../../db/supplier-service.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublicService } from '../types/index.js';

export async function listSupplierServices(
  supplierId: string,
  orgId: string,
): Promise<SupplierService[]> {
  try {
    const rows = await supplierServiceDb.findBySupplierAndOrg(supplierId, orgId);
    return rows.map(toPublicService);
  } catch (error) {
    logger.error('Error listing supplier services', { error: getErrorMessage(error) });
    throw error;
  }
}
