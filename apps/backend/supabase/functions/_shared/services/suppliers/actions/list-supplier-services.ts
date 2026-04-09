import { logger } from '../../../utils/logger.ts';
import * as supplierServiceDb from '../../../db/supplier-service.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { toPublicService } from '../types/index.ts';
import type { SupplierService } from '../types/index.ts';

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
