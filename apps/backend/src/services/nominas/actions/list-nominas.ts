/**
 * List Nominas Action
 *
 * Returns all non-deleted nominas for an org, each enriched with its invoice IDs.
 */

import { logger } from '../../../utils/logger.js';
import * as nominaDb from '../../../db/nomina.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { NominaWithInvoiceIds } from '@supl/shared';

function toPublic(
  row: nominaDb.NominaRow,
  invoiceIds: string[],
): NominaWithInvoiceIds {
  return {
    id: row.id,
    organizationId: row.organization_id,
    createdByUserId: row.created_by_user_id,
    status: row.status,
    totalAmount: row.total_amount,
    invoiceCount: row.invoice_count,
    voucherStoragePath: row.voucher_storage_path,
    voucherStorageBucket: row.voucher_storage_bucket,
    paidAt: row.paid_at,
    paidByUserId: row.paid_by_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    invoiceIds,
  };
}

export async function listNominas(orgId: string): Promise<NominaWithInvoiceIds[]> {
  try {
    const rows = await nominaDb.findAllByOrg(orgId);

    const results = await Promise.all(
      rows.map(async (row) => {
        const invoiceIds = await nominaDb.findInvoiceIdsByNominaId(row.id);
        return toPublic(row, invoiceIds);
      }),
    );

    return results;
  } catch (error) {
    logger.error('Error listing nominas', { error: getErrorMessage(error) });
    throw error;
  }
}
