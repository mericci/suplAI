export type ContabilidadPeriod = 'all' | 'ytd' | '1m' | 'current_month' | '1y';

export interface CostCenterUser {
  userId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

export interface CostCenterWithAggregates {
  id: string;
  organizationId: string;
  externalId: string;
  name: string;
  totalAmount: number;
  paidAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  supplierCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CostCenterDetail extends CostCenterWithAggregates {
  users: CostCenterUser[];
}

export interface CreateCostCenterPayload {
  externalId: string;
  name: string;
  userIds?: string[];
}

export interface UpdateCostCenterPayload {
  externalId?: string;
  name?: string;
  userIds?: string[];
}

export interface AccountingIdWithAggregates {
  id: string;
  organizationId: string;
  externalId: string;
  description: string;
  totalAmount: number;
  paidAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  supplierCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAccountingIdPayload {
  externalId: string;
  description: string;
}

export interface UpdateAccountingIdPayload {
  externalId?: string;
  description?: string;
}
