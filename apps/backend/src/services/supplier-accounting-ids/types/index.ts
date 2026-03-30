export type DistributionType = 'single' | 'average' | 'percentage' | 'manual';

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
