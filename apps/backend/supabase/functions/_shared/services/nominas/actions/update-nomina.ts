/**
 * Update Nomina Invoices Action (Edge Function)
 */

import { logger } from '../../../utils/logger.ts';
import * as nominaDb from '../../../db/nomina.db.ts';
import * as invoiceDb from '../../../db/invoice.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { z } from 'zod';

const UpdateNominaInvoicesSchema = z.object({
  invoiceIds: z.array(z.string().uuid()).min(1, 'At least one invoice is required'),
});

interface NominaWithInvoiceIds {
  id: string;
  organizationId: string;
  createdByUserId: string;
  status: string;
  totalAmount: number;
  invoiceCount: number;
  voucherStoragePath: string | null;
  voucherStorageBucket: string | null;
  paidAt: string | null;
  paidByUserId: string | null;
  createdAt: string;
  updatedAt: string;
  invoiceIds: string[];
}

function toPublic(row: nominaDb.NominaRow, invoiceIds: string[]): NominaWithInvoiceIds {
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

export async function updateNomina(
  id: string,
  orgId: string,
  rawData: unknown,
): Promise<NominaWithInvoiceIds> {
  try {
    const { invoiceIds: newInvoiceIds } = UpdateNominaInvoicesSchema.parse(rawData);

    const nomina = await nominaDb.findById(id, orgId);
    if (!nomina) throw new Error('Nomina not found');
    if (nomina.status !== 'pending') {
      throw new Error('Only pending nominas can be edited');
    }

    const allLockedIds = await nominaDb.findLockedInvoiceIds(orgId);
    const currentIds = await nominaDb.findInvoiceIdsByNominaId(id);
    const currentSet = new Set(currentIds);
    const lockedByOthers = new Set(allLockedIds.filter((lid) => !currentSet.has(lid)));

    const { invoices } = await invoiceDb.findAllByOrganization(orgId, newInvoiceIds.length, 0, {
      status: 'approved',
    });
    const approvedMap = new Map(invoices.map((inv) => [inv.id, inv]));

    for (const invoiceId of newInvoiceIds) {
      if (!approvedMap.has(invoiceId)) {
        throw new Error(`Invoice ${invoiceId} is not approved or does not belong to this organization`);
      }
      if (lockedByOthers.has(invoiceId)) {
        throw new Error(`Invoice ${invoiceId} is already in another pending nomina`);
      }
    }

    const newTotalAmount = newInvoiceIds.reduce(
      (sum, invoiceId) => sum + (approvedMap.get(invoiceId)!.gross_amount ?? 0),
      0,
    );

    logger.info('Updating nomina invoices', { nominaId: id, invoiceCount: newInvoiceIds.length, newTotalAmount });

    const updatedRow = await nominaDb.replaceNominaInvoices(id, orgId, newInvoiceIds, newTotalAmount);

    logger.info('Nomina updated', { nominaId: id });
    return toPublic(updatedRow, newInvoiceIds);
  } catch (error) {
    logger.error('Error updating nomina', { error: getErrorMessage(error) });
    throw error;
  }
}
