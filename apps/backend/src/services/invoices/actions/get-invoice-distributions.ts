/**
 * Get Invoice Distributions Action
 *
 * Returns cost center and accounting ID distributions for a specific invoice.
 */

import { logger } from '../../../utils/logger.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import {
  getCostCenterDistributionsByInvoiceId,
  getAccountingIdDistributionsByInvoiceId,
  type InvoiceCostCenterDistributionRow,
  type InvoiceAccountingIdDistributionRow,
} from '../../../db/invoice-distribution.db.js';
import { getErrorMessage } from '../../../utils/error.js';

export interface InvoiceDistributions {
  costCenters: InvoiceCostCenterDistributionRow[];
  accountingIds: InvoiceAccountingIdDistributionRow[];
}

export async function getInvoiceDistributions(
  id: string,
  organizationId: string,
): Promise<InvoiceDistributions> {
  try {
    const existing = await invoiceDb.findById(id, organizationId);
    if (!existing) throw new Error('Invoice not found');

    const [costCenters, accountingIds] = await Promise.all([
      getCostCenterDistributionsByInvoiceId(id, organizationId),
      getAccountingIdDistributionsByInvoiceId(id, organizationId),
    ]);

    return { costCenters, accountingIds };
  } catch (error) {
    logger.error('Error getting invoice distributions', { error: getErrorMessage(error) });
    throw error;
  }
}
