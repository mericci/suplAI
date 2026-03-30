import * as db from '../../../db/supplier-accounting-id.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { SupplierAccountingIdLink } from '../types/index.js';

export async function listSupplierAccountingIds(
  supplierId: string,
  organizationId: string,
): Promise<SupplierAccountingIdLink[]> {
  try {
    const rows = await db.findAllBySupplierAndOrg(supplierId, organizationId);
    return rows.map((row) => ({
      id: row.id,
      supplierId: row.supplier_id,
      organizationId: row.organization_id,
      accountingId: row.accounting_id,
      accountingExternalId: row.accounting_external_id,
      accountingDescription: row.accounting_description,
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
