export type { ContabilidadPeriod, PeriodWindow } from '../../../commons/period-window.js';

export interface CostCenterUser {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface CostCenterPublic {
  id: string;
  organizationId: string;
  externalId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface CostCenterWithAggregates extends CostCenterPublic {
  totalAmount: number;
  paidAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  supplierCount: number;
}

export interface CostCenterDetail extends CostCenterWithAggregates {
  users: CostCenterUser[];
}
