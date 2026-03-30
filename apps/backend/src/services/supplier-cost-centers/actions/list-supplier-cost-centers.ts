import * as db from '../../../db/supplier-cost-center.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { SupplierCostCenterLink } from '../types/index.js';

export async function listSupplierCostCenters(
  supplierId: string,
  organizationId: string,
): Promise<SupplierCostCenterLink[]> {
  try {
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
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
}
