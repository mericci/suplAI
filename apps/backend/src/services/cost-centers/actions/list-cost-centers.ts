/**
 * List Cost Centers Action
 *
 * Returns all cost centers for an org with aggregated invoice amounts for the requested period.
 * Uses a single invoice query (IN clause on all cost center IDs) to avoid N+1 queries.
 */

import { supabase } from '../../../lib/supabase.js';
import * as costCenterDb from '../../../db/cost-center.db.js';
import { getPeriodWindow } from '../../../commons/period-window.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { ContabilidadPeriod, CostCenterWithAggregates } from '../types/index.js';

interface InvoiceAggRow {
  cost_center_id: string | null;
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

export async function listCostCenters(
  organizationId: string,
  period: ContabilidadPeriod = 'current_month',
): Promise<CostCenterWithAggregates[]> {
  try {
    const costCenters = await costCenterDb.findAllByOrganization(organizationId);
    if (costCenters.length === 0) return [];

    const ccIds = costCenters.map((cc) => cc.id);
    const window = getPeriodWindow(period);

    // Single invoice query for all cost centers
    let query = supabase
      .from('invoices' as never)
      .select('cost_center_id, gross_amount, status, supplier_id')
      .eq('organization_id', organizationId)
      .in('cost_center_id', ccIds)
      .is('deleted_at', null);

    if (window.start) query = (query as ReturnType<typeof query.gte>).gte('issue_date', window.start);
    if (window.end) query = (query as ReturnType<typeof query.lte>).lte('issue_date', window.end);

    const { data: invoices, error } = await query;
    if (error) throw new Error(`Database error: ${error.message}`);

    // Aggregate in memory grouped by cost_center_id
    const aggMap = new Map<string, Aggregates>();
    for (const cc of costCenters) {
      aggMap.set(cc.id, { total: 0, paid: 0, approved: 0, pending: 0, supplierIds: new Set() });
    }

    for (const row of ((invoices ?? []) as InvoiceAggRow[])) {
      if (!row.cost_center_id) continue;
      const agg = aggMap.get(row.cost_center_id);
      if (!agg) continue;

      const amount = Number(row.gross_amount ?? 0);
      agg.total += amount;
      if (row.status === 'paid') agg.paid += amount;
      else if (row.status === 'approved') agg.approved += amount;
      else if (row.status === 'pending') agg.pending += amount;
      if (row.supplier_id) agg.supplierIds.add(row.supplier_id);
    }

    return costCenters.map((cc) => {
      const agg = aggMap.get(cc.id) ?? { total: 0, paid: 0, approved: 0, pending: 0, supplierIds: new Set() };
      return {
        id: cc.id,
        organizationId: cc.organization_id,
        externalId: cc.external_id,
        name: cc.name,
        createdAt: cc.created_at,
        updatedAt: cc.updated_at,
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
