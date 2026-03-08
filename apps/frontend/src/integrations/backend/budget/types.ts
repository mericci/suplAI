export type Periodicity = 'monthly' | 'quarterly' | 'annual';
export type BudgetPeriod = 'current_month' | 'ytd' | 'annual';

export interface BudgetItemWithSpend {
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

export interface CreateBudgetItemPayload {
  name: string;
  description?: string | null;
  amount: number;
  currency?: string;
  periodicity: Periodicity;
  supplierId?: string | null;
}
