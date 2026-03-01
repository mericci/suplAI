/**
 * List Suppliers Action
 */

import { logger } from '../../../utils/logger.ts';
import * as supplierDb from '../../../db/supplier.db.ts';
import { validateSupplierListFilters } from '../../../db/schemas/index.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { toPublic } from '../types/index.ts';
import type { SupplierPublic } from '../types/index.ts';
import type { PaginatedResponse } from '../../../types/api.ts';

export async function listSuppliers(
  filters: unknown,
): Promise<PaginatedResponse<SupplierPublic>> {
  try {
    const validated = validateSupplierListFilters(filters);
    const offset = (validated.page - 1) * validated.limit;

    const { suppliers, total } = await supplierDb.findAll(
      validated.limit,
      offset,
      validated.search,
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
    logger.error('Error listing suppliers', { error: getErrorMessage(error) });
    throw error;
  }
}
