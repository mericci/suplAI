/**
 * Update Nomina Invoices Action
 *
 * Replaces the invoice list of a pending nomina.
 * Only works on nominas with status='pending'.
 */

import { logger } from '../../../utils/logger.js';
import * as nominaDb from '../../../db/nomina.db.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import { UpdateNominaInvoicesSchema } from '../../../db/schemas/nomina.schema.js';
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

    // Locked IDs from OTHER pending nominas (exclude current nomina's own invoices)
    const allLockedIds = await nominaDb.findLockedInvoiceIds(orgId);
    const currentIds = await nominaDb.findInvoiceIdsByNominaId(id);
    const currentSet = new Set(currentIds);
    // Locked by OTHER nominas = locked overall minus what's in this nomina
    const lockedByOthers = new Set(allLockedIds.filter((lid) => !currentSet.has(lid)));

    // Validate all requested invoice IDs
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
