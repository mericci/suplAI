import { successResponse, serverError, validationError } from '../../../utils/response.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import * as invoiceDistributionDb from '../../../db/invoice-distribution.db.ts';
import { supabase } from '../../../lib/supabase.ts';

export async function createInvoiceDistributionsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[3];
    const invoiceId = segments[5];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!invoiceId || !isValidUUID(invoiceId)) return validationError('Invalid invoice ID');

    let body: unknown;
    try { body = await req.json(); } catch { return validationError('Invalid JSON body'); }

    const payload = body as {
      costCenterDistributions?: Array<{ costCenterId: string; amount: number }>;
      accountingIdDistributions?: Array<{ accountingId: string; amount: number }>;
    };

    const { costCenterDistributions = [], accountingIdDistributions = [] } = payload;

    if (costCenterDistributions.length === 0 && accountingIdDistributions.length === 0) {
      return validationError('At least one distribution is required');
    }

    const { data: invoice, error } = await supabase
      .from('invoices' as never)
      .select('net_amount')
      .eq('id', invoiceId)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single();

    if (error || !invoice) return validationError('Invoice not found');

    const netAmount = Number((invoice as { net_amount: number | null }).net_amount ?? 0);

    if (costCenterDistributions.length > 0) {
      const total = costCenterDistributions.reduce((sum, d) => sum + d.amount, 0);
      if (total !== netAmount) {
        return validationError(`Cost center distribution amounts must sum to ${netAmount}, got ${total}`);
      }
      await invoiceDistributionDb.createCostCenterDistributions(
        costCenterDistributions.map((d) => ({
          invoice_id: invoiceId,
          cost_center_id: d.costCenterId,
          organization_id: orgId,
          amount: d.amount,
        })),
      );
    }

    if (accountingIdDistributions.length > 0) {
      const total = accountingIdDistributions.reduce((sum, d) => sum + d.amount, 0);
      if (total !== netAmount) {
        return validationError(`Accounting ID distribution amounts must sum to ${netAmount}, got ${total}`);
      }
      await invoiceDistributionDb.createAccountingIdDistributions(
        accountingIdDistributions.map((d) => ({
          invoice_id: invoiceId,
          accounting_id: d.accountingId,
          organization_id: orgId,
          amount: d.amount,
        })),
      );
    }

    return successResponse({ created: true });
  } catch (error) {
    return serverError(error instanceof Error ? error.message : 'Unexpected error');
  }
}
