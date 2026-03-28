/**
 * Get Cost Center Action (Edge Function)
 */

import { supabase } from '../../../lib/supabase.ts';
import * as costCenterDb from '../../../db/cost-center.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { CostCenterDetail } from '../types/index.ts';

interface InvoiceAggRow {
  cost_center_id: string | null;
  gross_amount: number | null;
  status: string;
  supplier_id: string;
}

export async function getCostCenter(
  id: string,
  organizationId: string,
): Promise<CostCenterDetail | null> {
  try {
    const cc = await costCenterDb.findById(id, organizationId);
    if (!cc) return null;

    const [users, invoiceResult] = await Promise.all([
      costCenterDb.findUsersForCostCenter(id),
      supabase
        .from('invoices' as never)
        .select('cost_center_id, gross_amount, status, supplier_id')
        .eq('organization_id', organizationId)
        .eq('cost_center_id', id)
        .is('deleted_at', null),
    ]);

    const { data: invoices, error } = invoiceResult as { data: InvoiceAggRow[] | null; error: { message: string } | null };
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
      id: cc.id,
      organizationId: cc.organization_id,
      externalId: cc.external_id,
      name: cc.name,
      createdAt: cc.created_at,
      updatedAt: cc.updated_at,
      totalAmount: total,
      paidAmount: paid,
      approvedAmount: approved,
      pendingAmount: pending,
      supplierCount: supplierIds.size,
      users,
    };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
