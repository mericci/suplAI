import * as db from '../../../db/supplier-accounting-id.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { SupplierAccountingIdLink, UpsertSupplierAccountingIdsPayload } from '../types/index.js';

export async function upsertSupplierAccountingIds(
  supplierId: string,
  organizationId: string,
  payload: UpsertSupplierAccountingIdsPayload,
): Promise<SupplierAccountingIdLink[]> {
  try {
    const { distributionType, assignments } = payload;

    if (distributionType === 'single' && assignments.length !== 1) {
      throw new Error('Distribution type "single" requires exactly one accounting ID assignment.');
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
      accounting_id: a.accountingId,
      distribution_type: distributionType,
      percentage: distributionType === 'percentage' ? (a.percentage ?? null) : null,
      sort_order: index,
    }));

    const result = await db.replaceAll(supplierId, organizationId, rows);

    return result.map((row) => ({
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
