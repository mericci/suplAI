/**
 * List Invoices Action
 */

import { logger } from '../../../utils/logger.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import * as supplierServiceDb from '../../../db/supplier-service.db.js';
import { validateInvoiceListFilters } from '../../../db/schemas/index.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublic } from '../types/index.js';
import type { InvoicePublic } from '../types/index.js';
import type { PaginatedResponse } from '../../../types/api.js';

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

    const serviceIds = [
      ...new Set(
        invoices
          .map((inv) => (inv as unknown as Record<string, unknown>).service_id as string | null)
          .filter((id): id is string => id !== null),
      ),
    ];
    const serviceCostCenterMap = await supplierServiceDb.findCostCentersByServiceIds(serviceIds);

    return {
      success: true,
      data: invoices.map((inv) => {
        const serviceId = (inv as unknown as Record<string, unknown>).service_id as string | null;
        const serviceCostCenterId = serviceId ? (serviceCostCenterMap.get(serviceId) ?? null) : null;
        return toPublic(inv, serviceCostCenterId);
      }),
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
