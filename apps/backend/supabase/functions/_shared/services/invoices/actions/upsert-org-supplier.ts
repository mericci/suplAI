/**
 * Upsert Org-Supplier Junction Action
 *
 * Application-level find-or-create for the organization_suppliers junction table.
 * Ensures idempotent linking of a supplier to an organization.
 */

import { logger } from '../../../utils/logger.ts';
import * as orgSupplierDb from '../../../db/organization-supplier.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';

export async function upsertOrgSupplier(
  organizationId: string,
  supplierId: string,
): Promise<void> {
  try {
    const existing = await orgSupplierDb.findByOrgAndSupplier(
      organizationId,
      supplierId,
    );

    if (existing) {
      return;
    }

    await orgSupplierDb.create(organizationId, supplierId);
    logger.info('Org-supplier link created', { organizationId, supplierId });
  } catch (error) {
    logger.error('Error upserting org-supplier link', {
      error: getErrorMessage(error),
    });
    throw error;
  }
}
