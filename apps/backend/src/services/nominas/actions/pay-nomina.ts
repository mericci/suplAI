/**
 * Pay Nomina Action
 *
 * Validates the payment voucher amount against the nomina total,
 * uploads the voucher file, marks all invoices as paid,
 * and transitions the nomina to 'paid'.
 */

import { logger } from '../../../utils/logger.js';
import * as nominaDb from '../../../db/nomina.db.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import * as eventDb from '../../../db/invoice-event.db.js';
import { uploadFile } from '../../../storage/service.js';
import { extractVoucherAmount } from './extract-voucher-amount.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { NominaWithInvoiceIds } from '@supl/shared';

const VOUCHER_BUCKET = 'nomina-vouchers';

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

export class AmountMismatchError extends Error {
  constructor(
    public extracted: number,
    public expected: number,
  ) {
    super('Voucher amount does not match nomina total');
    this.name = 'AmountMismatchError';
  }
}

export async function payNomina(
  id: string,
  orgId: string,
  userId: string,
  fileBytes: Uint8Array,
  mimeType: string,
  fileName: string,
): Promise<NominaWithInvoiceIds> {
  try {
    logger.info('Paying nomina', { nominaId: id, orgId });

    const nomina = await nominaDb.findById(id, orgId);
    if (!nomina) throw new Error('Nomina not found');
    if (nomina.status !== 'pending') {
      throw new Error(`Nomina cannot be paid: current status is '${nomina.status}'`);
    }

    // Extract amount from voucher via AI
    const extractedAmount = await extractVoucherAmount(fileBytes, mimeType);

    if (extractedAmount !== nomina.total_amount) {
      throw new AmountMismatchError(extractedAmount, nomina.total_amount);
    }

    // Upload voucher file
    const storagePath = `${orgId}/${id}/${fileName}`;
    const { path: uploadedPath } = await uploadFile({
      bucket: VOUCHER_BUCKET,
      path: storagePath,
      file: new Blob([fileBytes], { type: mimeType }),
      contentType: mimeType,
    });

    // Bulk-update all invoices in nomina to paid
    const invoiceIds = await nominaDb.findInvoiceIdsByNominaId(id);
    const paidAt = new Date().toISOString();

    await Promise.all(
      invoiceIds.map((invoiceId) =>
        invoiceDb.update(invoiceId, orgId, {
          status: 'paid',
          paid_at: paidAt,
        } as never),
      ),
    );

    // Update nomina to paid
    const updated = await nominaDb.update(id, orgId, {
      status: 'paid',
      paid_at: paidAt,
      paid_by_user_id: userId,
      voucher_storage_path: uploadedPath,
      voucher_storage_bucket: VOUCHER_BUCKET,
    });

    // Record paid events for all invoices (fire-and-forget)
    eventDb.createEvents(
      invoiceIds.map((invoiceId) => ({
        invoice_id: invoiceId,
        organization_id: orgId,
        event_type: 'paid',
        actor_user_id: userId,
        metadata: { nomina_id: id } as never,
        occurred_at: paidAt,
      })),
    ).catch((e) => logger.warn('Failed to record paid events', { error: getErrorMessage(e) }));

    logger.info('Nomina paid', { nominaId: id });
    return toPublic(updated, invoiceIds);
  } catch (error) {
    logger.error('Error paying nomina', { error: getErrorMessage(error) });
    throw error;
  }
}
