import { logger } from '../../../utils/logger.ts';
import * as supplierServiceDb from '../../../db/supplier-service.db.ts';
import { validateCreateSupplierService } from '../../../db/schemas/supplier-service.schema.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { toPublicService } from '../types/index.ts';
import type { SupplierService } from '../types/index.ts';

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
