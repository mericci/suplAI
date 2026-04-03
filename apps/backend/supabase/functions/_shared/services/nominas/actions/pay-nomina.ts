/**
 * Pay Nomina Action (Edge Function)
 */

import { logger } from '../../../utils/logger.ts';
import * as nominaDb from '../../../db/nomina.db.ts';
import * as invoiceDb from '../../../db/invoice.db.ts';
import * as eventDb from '../../../db/invoice-event.db.ts';
import { uploadFile } from '../../../storage/service.ts';
import { extractVoucherAmount } from './extract-voucher-amount.ts';
import { getErrorMessage } from '../../../utils/error.ts';

const VOUCHER_BUCKET = 'nomina-vouchers';

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

    const extractedAmount = await extractVoucherAmount(fileBytes, mimeType);

    if (extractedAmount !== nomina.total_amount) {
      throw new AmountMismatchError(extractedAmount, nomina.total_amount);
    }

    const storagePath = `${orgId}/${id}/${fileName}`;
    const { path: uploadedPath } = await uploadFile({
      bucket: VOUCHER_BUCKET,
      path: storagePath,
      file: new Blob([fileBytes], { type: mimeType }),
      contentType: mimeType,
    });

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

    const updated = await nominaDb.update(id, orgId, {
      status: 'paid',
      paid_at: paidAt,
      paid_by_user_id: userId,
      voucher_storage_path: uploadedPath,
      voucher_storage_bucket: VOUCHER_BUCKET,
    });

    eventDb.createEvents(
      invoiceIds.map((invoiceId) => ({
        invoice_id: invoiceId,
        organization_id: orgId,
        event_type: 'paid',
        actor_user_id: userId,
        metadata: { nomina_id: id } as never,
        occurred_at: paidAt,
      })),
    ).catch((e: unknown) => logger.warn('Failed to record paid events', { error: getErrorMessage(e) }));

    logger.info('Nomina paid', { nominaId: id });
    return toPublic(updated, invoiceIds);
  } catch (error) {
    logger.error('Error paying nomina', { error: getErrorMessage(error) });
    throw error;
  }
}
