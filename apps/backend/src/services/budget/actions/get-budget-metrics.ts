/**
 * Get Budget Metrics Action
 *
 * Returns monthly spend vs. budget for the rolling 12-month window.
 */

import { supabase } from '../../../lib/supabase.js';
import * as budgetItemDb from '../../../db/budget-item.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { BudgetMetrics, BudgetMonthData, Periodicity } from '../types/index.js';

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
  const m = parseInt(monthStr, 10) - 1; // 0-indexed
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
  return amount / 12; // annual
}

export async function getBudgetMetrics(organizationId: string): Promise<BudgetMetrics> {
  try {
    const months = getLast12Months();
    const firstMonth = months[0];
    const lastMonth = months[months.length - 1];

    // Fetch all invoices for the 12-month window
    const { start: windowStart } = getMonthWindow(firstMonth);
    const { end: windowEnd } = getMonthWindow(lastMonth);

    const { data: invoices, error } = await supabase
      .from('invoices')
      .select('gross_amount, issue_date')
      .eq('organization_id', organizationId)
      .gte('issue_date', windowStart)
      .lte('issue_date', windowEnd)
      .is('deleted_at', null);

    if (error) throw new Error(`Database error: ${error.message}`);

    // Group invoice spend by month
    const spendByMonth: Record<string, number> = {};
    for (const inv of invoices ?? []) {
      const key = monthKey(new Date(inv.issue_date));
      spendByMonth[key] = (spendByMonth[key] ?? 0) + (inv.gross_amount ?? 0);
    }

    // Get total monthly budget from all active budget items
    const items = await budgetItemDb.findAllByOrganization(organizationId);
    const totalMonthlyBudget = items.reduce(
      (sum, item) => sum + getMonthlyAmount(Number(item.amount), item.periodicity as Periodicity),
      0,
    );

    const monthly: BudgetMonthData[] = months.map((month) => {
      const totalSpent = spendByMonth[month] ?? 0;
      const compliancePct = totalMonthlyBudget > 0
        ? Math.min(Math.round((totalSpent / totalMonthlyBudget) * 100), 999)
        : 0;
      return {
        month,
        totalBudget: totalMonthlyBudget,
        totalSpent,
        compliancePct,
      };
    });

    return { monthly };
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
