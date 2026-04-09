/**
 * Create Supplier Service Action
 *
 * Creates a new service entry for a supplier within an organization.
 */

import type { SupplierService } from '@supl/shared';
import { logger } from '../../../utils/logger.js';
import * as supplierServiceDb from '../../../db/supplier-service.db.js';
import { validateCreateSupplierService } from '../../../db/schemas/supplier-service.schema.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublicService } from '../types/index.js';

export async function createSupplierService(data: unknown): Promise<SupplierService> {
  try {
    const validated = validateCreateSupplierService(data);

    logger.info('Creating supplier service', {
      supplierId: validated.supplierId,
      organizationId: validated.organizationId,
      serviceCategory: validated.serviceCategory,
    });

    const row = await supplierServiceDb.create({
      supplier_id: validated.supplierId,
      organization_id: validated.organizationId,
      service_category: validated.serviceCategory,
      service_description: validated.serviceDescription,
    });

    logger.info('Supplier service created', { serviceId: row.id });
    return toPublicService(row);
  } catch (error) {
    logger.error('Error creating supplier service', { error: getErrorMessage(error) });
    throw error;
  }
}
