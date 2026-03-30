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

export type DistributionType = 'single' | 'average' | 'percentage' | 'manual';

export interface SupplierCostCenterLink {
  id: string;
  supplierId: string;
  organizationId: string;
  costCenterId: string;
  costCenterName: string;
  costCenterExternalId: string;
  distributionType: DistributionType;
  percentage: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertSupplierCostCentersPayload {
  distributionType: DistributionType;
  assignments: Array<{
    costCenterId: string;
    percentage?: number | null;
  }>;
}

export interface SupplierAccountingIdLink {
  id: string;
  supplierId: string;
  organizationId: string;
  accountingId: string;
  accountingExternalId: string;
  accountingDescription: string;
  distributionType: DistributionType;
  percentage: number | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertSupplierAccountingIdsPayload {
  distributionType: DistributionType;
  assignments: Array<{
    accountingId: string;
    percentage?: number | null;
  }>;
}

export interface PendingDistributionInvoice {
  id: string;
  folio: string;
  supplierName: string;
  netAmount: number;
  issueDate: string;
  pendingCostCenters: Array<{ id: string; name: string; externalId: string }>;
  pendingAccountingIds: Array<{ id: string; externalId: string; description: string }>;
}

export interface CreateInvoiceDistributionsPayload {
  costCenterDistributions?: Array<{ costCenterId: string; amount: number }>;
  accountingIdDistributions?: Array<{ accountingId: string; amount: number }>;
}
