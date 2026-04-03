import * as invoiceDb from '../../../db/invoice.db.ts';
import {
  getCostCenterDistributionsByInvoiceId,
  getAccountingIdDistributionsByInvoiceId,
  type InvoiceCostCenterDistributionRow,
  type InvoiceAccountingIdDistributionRow,
} from '../../../db/invoice-distribution.db.ts';

export interface InvoiceDistributions {
  costCenters: InvoiceCostCenterDistributionRow[];
  accountingIds: InvoiceAccountingIdDistributionRow[];
}

export async function getInvoiceDistributions(
  id: string,
  organizationId: string,
): Promise<InvoiceDistributions> {
  const existing = await invoiceDb.findById(id, organizationId);
  if (!existing) throw new Error('Invoice not found');

  const [costCenters, accountingIds] = await Promise.all([
    getCostCenterDistributionsByInvoiceId(id, organizationId),
    getAccountingIdDistributionsByInvoiceId(id, organizationId),
  ]);

  return { costCenters, accountingIds };
}
