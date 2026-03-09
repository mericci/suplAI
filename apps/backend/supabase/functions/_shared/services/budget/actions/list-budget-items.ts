/**
 * List Budget Items Action
 *
 * Returns budget items for an org with actual spend for the requested period.
 */

import { supabase } from '../../../lib/supabase.ts';
import * as budgetItemDb from '../../../db/budget-item.db.ts';
import * as supplierDb from '../../../db/supplier.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { BudgetItemWithSpend, BudgetPeriod, Periodicity } from '../types/index.ts';

interface PeriodWindow {
  start: string;
  end: string;
}

function getPeriodWindow(period: BudgetPeriod): PeriodWindow {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  if (period === 'current_month') {
    const start = new Date(year, month, 1);
    const end = new Date(year, month + 1, 0);
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    };
  }

  // Both ytd and annual: Jan 1 to today
  const start = new Date(year, 0, 1);
  return {
    start: start.toISOString().split('T')[0],
    end: now.toISOString().split('T')[0],
  };
}

function getMonthsElapsed(): number {
  const now = new Date();
  return now.getMonth() + 1; // 1-12
}

function scaleBudget(amount: number, periodicity: Periodicity, period: BudgetPeriod): number {
  const months = getMonthsElapsed();

  let monthlyAmount: number;
  if (periodicity === 'monthly') {
    monthlyAmount = amount;
  } else if (periodicity === 'quarterly') {
    monthlyAmount = amount / 3;
  } else {
    monthlyAmount = amount / 12;
  }

  if (period === 'current_month') return monthlyAmount;
  if (period === 'annual') return monthlyAmount * 12;
  return monthlyAmount * months;
}

async function getSpendForSupplier(
  organizationId: string,
  supplierId: string,
  window: PeriodWindow,
): Promise<number> {
  const { data, error } = await supabase
    .from('invoices')
    .select('gross_amount')
    .eq('organization_id', organizationId)
    .eq('supplier_id', supplierId)
    .gte('issue_date', window.start)
    .lte('issue_date', window.end)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []).reduce((sum, row) => sum + (row.gross_amount ?? 0), 0);
}

async function getSupplierName(supplierId: string): Promise<string | null> {
  const supplier = await supplierDb.findById(supplierId);
  return supplier?.legal_name ?? null;
}

export async function listBudgetItems(
  organizationId: string,
  period: BudgetPeriod = 'current_month',
): Promise<BudgetItemWithSpend[]> {
  try {
    const items = await budgetItemDb.findAllByOrganization(organizationId);
    const window = getPeriodWindow(period);

    const itemsWithSpend = await Promise.all(
      items.map(async (item) => {
        const scaledBudget = scaleBudget(Number(item.amount), item.periodicity as Periodicity, period);
        let spentAmount = 0;
        let supplierName: string | null = null;

        if (item.supplier_id) {
          [spentAmount, supplierName] = await Promise.all([
            getSpendForSupplier(organizationId, item.supplier_id, window),
            getSupplierName(item.supplier_id),
          ]);
        }

        const compliancePct = scaledBudget > 0
          ? Math.min(Math.round((spentAmount / scaledBudget) * 100), 999)
          : 0;

        return {
          id: item.id,
          organizationId: item.organization_id,
          name: item.name,
          description: item.description ?? null,
          amount: Number(item.amount),
          currency: item.currency,
          periodicity: item.periodicity as Periodicity,
          supplierId: item.supplier_id ?? null,
          supplierName,
          createdAt: item.created_at,
          updatedAt: item.updated_at,
          scaledBudget,
          spentAmount,
          compliancePct,
        };
      }),
    );

    return itemsWithSpend;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
