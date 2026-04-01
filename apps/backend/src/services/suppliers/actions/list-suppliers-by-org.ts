/**
 * List Suppliers by Organization Action
 */

import { logger } from '../../../utils/logger.js';
import * as supplierDb from '../../../db/supplier.db.js';
import { validateSupplierListFilters } from '../../../db/schemas/index.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublic } from '../types/index.js';
import type { SupplierPublic } from '../types/index.js';
import type { PaginatedResponse } from '../../../types/api.js';

export async function listSuppliersByOrg(
  organizationId: string,
  filters: unknown,
): Promise<PaginatedResponse<SupplierPublic>> {
  try {
    const validated = validateSupplierListFilters(filters);
    const offset = (validated.page - 1) * validated.limit;

    const { suppliers, total } = await supplierDb.findByOrganization(
      organizationId,
      validated.limit,
      offset,
      validated.search,
      validated.sortBy,
      validated.sortDir,
    );

    return {
      success: true,
      data: suppliers.map(toPublic),
      pagination: {
        page: validated.page,
        limit: validated.limit,
        total,
        totalPages: Math.ceil(total / validated.limit),
      },
    };
  } catch (error) {
    logger.error('Error listing suppliers by organization', {
      error: getErrorMessage(error),
    });
    throw error;
  }
}
