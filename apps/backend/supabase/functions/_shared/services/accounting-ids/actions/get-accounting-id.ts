/**
 * Get Accounting ID Action (Edge Function)
 */

import { supabase } from '../../../lib/supabase.ts';
import * as accountingIdDb from '../../../db/accounting-id.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { AccountingIdWithAggregates } from '../types/index.ts';

interface InvoiceAggRow {
  accounting_id: string | null;
  gross_amount: number | null;
  status: string;
  supplier_id: string;
}

export async function getAccountingId(
  id: string,
  organizationId: string,
): Promise<AccountingIdWithAggregates | null> {
  try {
    const item = await accountingIdDb.findById(id, organizationId);
    if (!item) return null;

    const { data: invoices, error } = await supabase
      .from('invoices' as never)
      .select('accounting_id, gross_amount, status, supplier_id')
      .eq('organization_id', organizationId)
      .eq('accounting_id', id)
      .is('deleted_at', null) as { data: InvoiceAggRow[] | null; error: { message: string } | null };

    if (error) throw new Error(`Database error: ${error.message}`);

    let total = 0, paid = 0, approved = 0, pending = 0;
    const supplierIds = new Set<string>();

    for (const row of (invoices ?? [])) {
      const amount = Number(row.gross_amount ?? 0);
      total += amount;
      if (row.status === 'paid') paid += amount;
      else if (row.status === 'approved') approved += amount;
      else if (row.status === 'pending') pending += amount;
      if (row.supplier_id) supplierIds.add(row.supplier_id);
    }

    return {
      id: item.id,
      organizationId: item.organization_id,
      externalId: item.external_id,
      description: item.description,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      totalAmount: total,
      paidAmount: paid,
      approvedAmount: approved,
      pendingAmount: pending,
      supplierCount: supplierIds.size,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
