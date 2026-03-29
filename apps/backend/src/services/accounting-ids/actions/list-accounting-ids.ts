/**
 * List Accounting IDs Action
 *
 * Returns all accounting IDs for an org with aggregated invoice amounts for the requested period.
 */

import { supabase } from '../../../lib/supabase.js';
import * as accountingIdDb from '../../../db/accounting-id.db.js';
import { getPeriodWindow } from '../../../commons/period-window.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { ContabilidadPeriod, AccountingIdWithAggregates } from '../types/index.js';

interface InvoiceAggRow {
  accounting_id: string | null;
  gross_amount: number | null;
  status: string;
  supplier_id: string;
}

interface Aggregates {
  total: number;
  paid: number;
  approved: number;
  pending: number;
  supplierIds: Set<string>;
}

export async function listAccountingIds(
  organizationId: string,
  period: ContabilidadPeriod = 'current_month',
): Promise<AccountingIdWithAggregates[]> {
  try {
    const items = await accountingIdDb.findAllByOrganization(organizationId);
    if (items.length === 0) return [];

    const itemIds = items.map((item) => item.id);
    const window = getPeriodWindow(period);

    let query = supabase
      .from('invoices' as never)
      .select('accounting_id, gross_amount, status, supplier_id')
      .eq('organization_id', organizationId)
      .in('accounting_id', itemIds)
      .is('deleted_at', null);

    if (window.start) query = (query as ReturnType<typeof query.gte>).gte('issue_date', window.start);
    if (window.end) query = (query as ReturnType<typeof query.lte>).lte('issue_date', window.end);

    const { data: invoices, error } = await query;
    if (error) throw new Error(`Database error: ${error.message}`);

    const aggMap = new Map<string, Aggregates>();
    for (const item of items) {
      aggMap.set(item.id, { total: 0, paid: 0, approved: 0, pending: 0, supplierIds: new Set() });
    }

    for (const row of ((invoices ?? []) as InvoiceAggRow[])) {
      if (!row.accounting_id) continue;
      const agg = aggMap.get(row.accounting_id);
      if (!agg) continue;

      const amount = Number(row.gross_amount ?? 0);
      agg.total += amount;
      if (row.status === 'paid') agg.paid += amount;
      else if (row.status === 'approved') agg.approved += amount;
      else if (row.status === 'pending') agg.pending += amount;
      if (row.supplier_id) agg.supplierIds.add(row.supplier_id);
    }

    return items.map((item) => {
      const agg = aggMap.get(item.id) ?? { total: 0, paid: 0, approved: 0, pending: 0, supplierIds: new Set() };
      return {
        id: item.id,
        organizationId: item.organization_id,
        externalId: item.external_id,
        description: item.description,
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        totalAmount: agg.total,
        paidAmount: agg.paid,
        approvedAmount: agg.approved,
        pendingAmount: agg.pending,
        supplierCount: agg.supplierIds.size,
      };
    });
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
