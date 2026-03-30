import * as db from '../../../db/supplier-cost-center.db.ts';
import type { SupplierCostCenterLink, UpsertSupplierCostCentersPayload } from '../types/index.ts';

export async function upsertSupplierCostCenters(
  supplierId: string,
  organizationId: string,
  payload: UpsertSupplierCostCentersPayload,
): Promise<SupplierCostCenterLink[]> {
  const { distributionType, assignments } = payload;

  if (distributionType === 'single' && assignments.length !== 1) {
    throw new Error('Distribution type "single" requires exactly one cost center assignment.');
  }

  if (distributionType === 'percentage') {
    const total = assignments.reduce((sum, a) => sum + (a.percentage ?? 0), 0);
    if (Math.abs(total - 100) > 0.01) {
      throw new Error(`Percentage assignments must sum to 100 (got ${total}).`);
    }
  }

  const rows = assignments.map((a, index) => ({
    supplier_id: supplierId,
    organization_id: organizationId,
    cost_center_id: a.costCenterId,
    distribution_type: distributionType,
    percentage: distributionType === 'percentage' ? (a.percentage ?? null) : null,
    sort_order: index,
  }));

  const result = await db.replaceAll(supplierId, organizationId, rows);

  return result.map((row) => ({
    id: row.id,
    supplierId: row.supplier_id,
    organizationId: row.organization_id,
    costCenterId: row.cost_center_id,
    costCenterName: row.cost_center_name,
    costCenterExternalId: row.cost_center_external_id,
    distributionType: row.distribution_type,
    percentage: row.percentage,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }));
}
