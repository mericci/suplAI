export type { ContabilidadPeriod, PeriodWindow } from '../../../commons/period-window.ts';

export interface AccountingIdPublic {
  id: string;
  organizationId: string;
  externalId: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountingIdWithAggregates extends AccountingIdPublic {
  totalAmount: number;
  paidAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  supplierCount: number;
}
