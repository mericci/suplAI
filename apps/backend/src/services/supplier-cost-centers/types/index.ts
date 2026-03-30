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
