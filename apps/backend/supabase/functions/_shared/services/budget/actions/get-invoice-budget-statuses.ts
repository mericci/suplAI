/**
 * Get Invoice Budget Statuses Action
 *
 * For each requested invoice, computes whether it falls within or exceeds
 * the budget for its supplier in the same month, ordered chronologically.
 */

import { supabase } from '../../../lib/supabase.ts';
import * as budgetItemDb from '../../../db/budget-item.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { Periodicity } from '../types/index.ts';
import type { Database } from '../../../types/supabase.ts';

type InvoiceRow = Database['public']['Tables']['invoices']['Row'];

export type BudgetImpactStatus = 'within' | 'exceeds' | 'no_budget';

export interface InvoiceBudgetStatus {
  status: BudgetImpactStatus;
  budgetAmount: number;
  spentBefore: number;
}

function toMonthlyBudget(amount: number, periodicity: Periodicity): number {
  if (periodicity === 'monthly') return amount;
  if (periodicity === 'quarterly') return amount / 3;
  return amount / 12;
}

function lastDayOfMonth(yearMonth: string): string {
  const [year, mon] = yearMonth.split('-').map(Number);
  return new Date(year, mon, 0).toISOString().split('T')[0];
}

export async function getInvoiceBudgetStatuses(
  organizationId: string,
  invoiceIds: string[],
): Promise<Record<string, InvoiceBudgetStatus>> {
  if (invoiceIds.length === 0) return {};

  try {
    const { data: rawInvoices, error: invError } = await supabase
      .from('invoices')
      .select('*')
      .in('id', invoiceIds)
      .eq('organization_id', organizationId)
      .is('deleted_at', null);

    const invoices = (rawInvoices ?? []) as InvoiceRow[];

    if (invError) throw new Error(invError.message);
    if (invoices.length === 0) return {};

    const allBudgetItems = await budgetItemDb.findAllByOrganization(organizationId);
    const budgetBySupplier = new Map(
      allBudgetItems
        .filter((b) => b.supplier_id !== null)
        .map((b) => [b.supplier_id!, b]),
    );

    type GroupKey = string;
    const groups = new Map<GroupKey, typeof invoices>();
    for (const inv of invoices) {
      if (!inv.supplier_id) continue;
      const key: GroupKey = `${inv.supplier_id}:${inv.issue_date.substring(0, 7)}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(inv);
    }

    const result: Record<string, InvoiceBudgetStatus> = {};

    await Promise.all(
      [...groups.entries()].map(async ([key, groupInvoices]) => {
        const colonIdx = key.indexOf(':');
        const supplierId = key.substring(0, colonIdx);
        const month = key.substring(colonIdx + 1);
        const budget = budgetBySupplier.get(supplierId);

        if (!budget) {
          for (const inv of groupInvoices) {
            result[inv.id] = { status: 'no_budget', budgetAmount: 0, spentBefore: 0 };
          }
          return;
        }

        const scaledBudget = toMonthlyBudget(
          Number(budget.amount),
          budget.periodicity as Periodicity,
        );

        const { data: rawMonthInvoices, error: monthError } = await supabase
          .from('invoices')
          .select('*')
          .eq('organization_id', organizationId)
          .eq('supplier_id', supplierId)
          .gte('issue_date', `${month}-01`)
          .lte('issue_date', lastDayOfMonth(month))
          .is('deleted_at', null)
          .order('issue_date', { ascending: true });

        if (monthError) throw new Error(monthError.message);

        const monthInvoices = ((rawMonthInvoices ?? []) as InvoiceRow[]).sort((a, b) => {
          if (a.issue_date !== b.issue_date) return a.issue_date < b.issue_date ? -1 : 1;
          return parseInt(a.document_number, 10) - parseInt(b.document_number, 10);
        });

        const requestedIds = new Set(groupInvoices.map((inv) => inv.id));
        let cumulativeSpent = 0;

        for (const inv of monthInvoices) {
          const invoiceAmount = inv.gross_amount ?? 0;
          if (requestedIds.has(inv.id)) {
            result[inv.id] = {
              status: cumulativeSpent + invoiceAmount > scaledBudget ? 'exceeds' : 'within',
              budgetAmount: scaledBudget,
              spentBefore: cumulativeSpent,
            };
          }
          cumulativeSpent += invoiceAmount;
        }
      }),
    );

    return result;
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
