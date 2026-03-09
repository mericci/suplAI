/**
 * Get Budget Metrics Action
 *
 * Returns monthly spend vs. budget for the rolling 12-month window.
 */

import { supabase } from '../../../lib/supabase.ts';
import * as budgetItemDb from '../../../db/budget-item.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { BudgetMetrics, BudgetMonthData, Periodicity } from '../types/index.ts';

function monthKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

function getLast12Months(): string[] {
  const months: string[] = [];
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(monthKey(d));
  }
  return months;
}

function getMonthWindow(month: string): { start: string; end: string } {
  const [yearStr, monthStr] = month.split('-');
  const year = parseInt(yearStr, 10);
  const m = parseInt(monthStr, 10) - 1;
  const start = new Date(year, m, 1);
  const end = new Date(year, m + 1, 0);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

function getMonthlyAmount(amount: number, periodicity: Periodicity): number {
  if (periodicity === 'monthly') return amount;
  if (periodicity === 'quarterly') return amount / 3;
  return amount / 12;
}

export async function getBudgetMetrics(
  organizationId: string,
  budgetItemIds?: string[],
): Promise<BudgetMetrics> {
  try {
    const months = getLast12Months();
    const firstMonth = months[0];
    const lastMonth = months[months.length - 1];

    const allItems = await budgetItemDb.findAllByOrganization(organizationId);
    const items = budgetItemIds && budgetItemIds.length > 0
      ? allItems.filter((item) => budgetItemIds.includes(item.id))
      : allItems;

    const supplierIds = [...new Set(
      items.map((item) => item.supplier_id).filter((id): id is string => id !== null),
    )];

    const totalMonthlyBudget = items.reduce(
      (sum, item) => sum + getMonthlyAmount(Number(item.amount), item.periodicity as Periodicity),
      0,
    );

    const { start: windowStart } = getMonthWindow(firstMonth);
    const { end: windowEnd } = getMonthWindow(lastMonth);

    let invoiceQuery = supabase
      .from('invoices')
      .select('gross_amount, issue_date')
      .eq('organization_id', organizationId)
      .gte('issue_date', windowStart)
      .lte('issue_date', windowEnd)
      .is('deleted_at', null);

    if (supplierIds.length > 0) {
      invoiceQuery = invoiceQuery.in('supplier_id', supplierIds);
    } else {
      const monthly: BudgetMonthData[] = months.map((month) => ({
        month,
        totalBudget: totalMonthlyBudget,
        totalSpent: 0,
        compliancePct: 0,
      }));
      return { monthly };
    }

    const { data: invoices, error } = await invoiceQuery;
    if (error) throw new Error(`Database error: ${error.message}`);

    const spendByMonth: Record<string, number> = {};
    for (const inv of invoices ?? []) {
      const key = monthKey(new Date(inv.issue_date));
      spendByMonth[key] = (spendByMonth[key] ?? 0) + (inv.gross_amount ?? 0);
    }

    const monthly: BudgetMonthData[] = months.map((month) => {
      const totalSpent = spendByMonth[month] ?? 0;
      const compliancePct = totalMonthlyBudget > 0
        ? Math.min(Math.round((totalSpent / totalMonthlyBudget) * 100), 999)
        : 0;
      return { month, totalBudget: totalMonthlyBudget, totalSpent, compliancePct };
    });

    return { monthly };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
