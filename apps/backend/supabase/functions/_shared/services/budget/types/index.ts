export type Periodicity = 'monthly' | 'quarterly' | 'annual';
export type BudgetPeriod = 'current_month' | 'ytd' | 'annual';

export interface BudgetItemPublic {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  amount: number;
  currency: string;
  periodicity: Periodicity;
  supplierId: string | null;
  supplierName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetItemWithSpend extends BudgetItemPublic {
  scaledBudget: number;
  spentAmount: number;
  compliancePct: number;
}

export interface BudgetMonthData {
  month: string;
  totalBudget: number;
  totalSpent: number;
  compliancePct: number;
}

export interface BudgetMetrics {
  monthly: BudgetMonthData[];
}
