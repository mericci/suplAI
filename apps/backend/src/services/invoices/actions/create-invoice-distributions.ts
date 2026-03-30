/**
 * Create Invoice Distributions Action
 *
 * Saves manual distribution records for an invoice.
 * Validates that amounts sum to the invoice's net_amount.
 */

import { supabase } from '../../../lib/supabase.js';
import * as invoiceDistributionDb from '../../../db/invoice-distribution.db.js';
import { getErrorMessage } from '../../../utils/error.js';

export interface CreateInvoiceDistributionsPayload {
  costCenterDistributions?: Array<{ costCenterId: string; amount: number }>;
  accountingIdDistributions?: Array<{ accountingId: string; amount: number }>;
}

export async function createInvoiceDistributions(
  invoiceId: string,
  organizationId: string,
  payload: CreateInvoiceDistributionsPayload,
): Promise<void> {
  try {
    // Fetch invoice to validate amounts
    const { data: invoice, error } = await supabase
      .from('invoices' as never)
      .select('net_amount')
      .eq('id', invoiceId)
      .eq('organization_id', organizationId)
      .is('deleted_at', null)
      .single();

    if (error || !invoice) throw new Error('Invoice not found');

    const netAmount = Number((invoice as { net_amount: number | null }).net_amount ?? 0);

    const { costCenterDistributions = [], accountingIdDistributions = [] } = payload;

    // Validate cost center amounts
    if (costCenterDistributions.length > 0) {
      const total = costCenterDistributions.reduce((sum, d) => sum + d.amount, 0);
      if (total !== netAmount) {
        throw new Error(`Cost center distribution amounts must sum to invoice net amount (${netAmount}), got ${total}`);
      }
      await invoiceDistributionDb.createCostCenterDistributions(
        costCenterDistributions.map((d) => ({
          invoice_id: invoiceId,
          cost_center_id: d.costCenterId,
          organization_id: organizationId,
          amount: d.amount,
        })),
      );
    }

    // Validate accounting ID amounts
    if (accountingIdDistributions.length > 0) {
      const total = accountingIdDistributions.reduce((sum, d) => sum + d.amount, 0);
      if (total !== netAmount) {
        throw new Error(`Accounting ID distribution amounts must sum to invoice net amount (${netAmount}), got ${total}`);
      }
      await invoiceDistributionDb.createAccountingIdDistributions(
        accountingIdDistributions.map((d) => ({
          invoice_id: invoiceId,
          accounting_id: d.accountingId,
          organization_id: organizationId,
          amount: d.amount,
        })),
      );
    }
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
