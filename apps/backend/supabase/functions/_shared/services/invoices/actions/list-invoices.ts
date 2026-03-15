/**
 * List Invoices Action
 */

import { logger } from '../../../utils/logger.ts';
import * as invoiceDb from '../../../db/invoice.db.ts';
import { validateInvoiceListFilters } from '../../../db/schemas/index.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { toPublic } from '../types/index.ts';
import type { InvoicePublic } from '../types/index.ts';
import type { PaginatedResponse } from '../../../types/api.ts';

export async function listInvoices(
  organizationId: string,
  rawFilters: unknown,
): Promise<PaginatedResponse<InvoicePublic>> {
  try {
    const filters = validateInvoiceListFilters(rawFilters);
    const offset = (filters.page - 1) * filters.limit;

    const { invoices, total } = await invoiceDb.findAllByOrganization(
      organizationId,
      filters.limit,
      offset,
      {
        status: filters.status,
        supplierId: filters.supplierId,
        issuedAfter: filters.issuedAfter,
        issuedBefore: filters.issuedBefore,
        grossAmountGte: filters.grossAmountGte,
        grossAmountLte: filters.grossAmountLte,
        grossAmountEq: filters.grossAmountEq,
        sortBy: filters.sortBy,
        sortDir: filters.sortDir,
      },
    );

    return {
      success: true,
      data: invoices.map(toPublic),
      pagination: {
        page: filters.page,
        limit: filters.limit,
        total,
        totalPages: Math.ceil(total / filters.limit),
      },
    };
  } catch (error) {
    logger.error('Error listing invoices', { error: getErrorMessage(error) });
    throw error;
  }
}
