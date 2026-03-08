export const BUDGET_PERIOD = {
  CURRENT_MONTH: 'current_month',
  YTD: 'ytd',
  ANNUAL: 'annual',
} as const;

export type BudgetPeriodKey = keyof typeof BUDGET_PERIOD;

export const BUDGET_PERIOD_LABELS: Record<string, string> = {
  current_month: 'Mes actual',
  ytd: 'YTD',
  annual: 'Anual',
};

export const PERIODICITY_LABELS: Record<string, string> = {
  monthly: 'Mensual',
  quarterly: 'Trimestral',
  annual: 'Anual',
};

export const CURRENCY_OPTIONS = [
  { value: 'CLP', label: 'CLP' },
  { value: 'USD', label: 'USD' },
  { value: 'EUR', label: 'EUR' },
];

export const PERIODICITY_OPTIONS = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'annual', label: 'Anual' },
];

export const MONTH_LABELS: Record<string, string> = {
  '01': 'ene',
  '02': 'feb',
  '03': 'mar',
  '04': 'abr',
  '05': 'may',
  '06': 'jun',
  '07': 'jul',
  '08': 'ago',
  '09': 'sep',
  '10': 'oct',
  '11': 'nov',
  '12': 'dic',
};
