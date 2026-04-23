/**
 * List Cost Centers Action (Edge Function)
 *
 * Returns all cost centers for an org with aggregated invoice + rendición amounts
 * for the requested period. Uses bulk queries (IN clause) to avoid N+1.
 */

import { supabase } from '../../../lib/supabase.ts';
import * as costCenterDb from '../../../db/cost-center.db.ts';
import { getPeriodWindow } from '../../../commons/period-window.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { ContabilidadPeriod, CostCenterWithAggregates } from '../types/index.ts';

interface InvoiceAggRow {
  cost_center_id: string | null;
  gross_amount: number | null;
  status: string;
  supplier_id: string;
}

interface RendicionDocAggRow {
  cost_center_id: string | null;
  amount: number | null;
  corrected_amount: number | null;
  rendiciones: { status: string } | null;
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

    // Initialize aggregates
    const aggMap = new Map<string, Aggregates>();
    for (const cc of costCenters) {
      aggMap.set(cc.id, {
        total: 0, paid: 0, approved: 0, pending: 0, supplierIds: new Set(),
      });
    }

    // Invoice aggregation
    let invoiceQuery = supabase
      .from('invoices' as never)
      .select('cost_center_id, gross_amount, status, supplier_id')
      .eq('organization_id', organizationId)
      .in('cost_center_id', ccIds)
      .is('deleted_at', null);

    if (window.start) invoiceQuery = (invoiceQuery as ReturnType<typeof invoiceQuery.gte>).gte('issue_date', window.start);
    if (window.end) invoiceQuery = (invoiceQuery as ReturnType<typeof invoiceQuery.lte>).lte('issue_date', window.end);

    const { data: invoices, error: invoiceError } = await invoiceQuery;
    if (invoiceError) throw new Error(`Database error: ${invoiceError.message}`);

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

    // Rendición document aggregation — valid, non-duplicate, assigned to a cost center
    let rendicionQuery = supabase
      .from('rendicion_documents' as never)
      .select('cost_center_id, amount, corrected_amount, rendiciones!inner(status)')
      .in('cost_center_id', ccIds)
      .is('deleted_at', null)
      .eq('ai_validation_status', 'valid')
      .eq('is_duplicate', false);

    if (window.start) rendicionQuery = (rendicionQuery as ReturnType<typeof rendicionQuery.gte>).gte('created_at', window.start);
    if (window.end) rendicionQuery = (rendicionQuery as ReturnType<typeof rendicionQuery.lte>).lte('created_at', window.end);

    const { data: rendicionDocs, error: rendicionError } = await rendicionQuery;
    if (rendicionError) throw new Error(`Database error: ${rendicionError.message}`);

    for (const row of ((rendicionDocs ?? []) as RendicionDocAggRow[])) {
      if (!row.cost_center_id) continue;
      const rendicionStatus = row.rendiciones?.status;
      if (!rendicionStatus || rendicionStatus === 'draft' || rendicionStatus === 'rejected') continue;
      const agg = aggMap.get(row.cost_center_id);
      if (!agg) continue;
      const amount = Number(row.corrected_amount ?? row.amount ?? 0);
      agg.total += amount;
      if (rendicionStatus === 'approved') agg.approved += amount;
      else if (rendicionStatus === 'pending') agg.pending += amount;
    }

    return costCenters.map((cc) => {
      const agg = aggMap.get(cc.id) ?? {
        total: 0, paid: 0, approved: 0, pending: 0, supplierIds: new Set(),
      };
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
