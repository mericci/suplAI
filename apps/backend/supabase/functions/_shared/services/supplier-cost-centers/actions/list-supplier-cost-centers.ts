import * as db from '../../../db/supplier-cost-center.db.ts';
import type { SupplierCostCenterLink } from '../types/index.ts';

export async function listSupplierCostCenters(
  supplierId: string,
  organizationId: string,
): Promise<SupplierCostCenterLink[]> {
  const rows = await db.findAllBySupplierAndOrg(supplierId, organizationId);
  return rows.map((row) => ({
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
