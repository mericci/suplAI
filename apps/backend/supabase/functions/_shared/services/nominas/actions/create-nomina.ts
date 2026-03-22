/**
 * Create Nomina Action (Edge Function)
 */

import { logger } from '../../../utils/logger.ts';
import * as nominaDb from '../../../db/nomina.db.ts';
import * as invoiceDb from '../../../db/invoice.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { z } from 'zod';

const CreateNominaSchema = z.object({
  invoiceIds: z.array(z.string().uuid()).optional().default([]),
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

export async function createNomina(
  orgId: string,
  userId: string,
  rawData: unknown,
): Promise<NominaWithInvoiceIds> {
  try {
    const { invoiceIds: requestedIds } = CreateNominaSchema.parse(rawData);

    const lockedIds = await nominaDb.findLockedInvoiceIds(orgId);
    const lockedSet = new Set(lockedIds);

    let targetInvoices: Awaited<ReturnType<typeof invoiceDb.findAllByOrganization>>['invoices'];

    if (requestedIds.length > 0) {
      const { invoices } = await invoiceDb.findAllByOrganization(orgId, requestedIds.length, 0, {
        status: 'approved',
      });

      const approvedMap = new Map(invoices.map((inv) => [inv.id, inv]));

      for (const id of requestedIds) {
        if (!approvedMap.has(id)) {
          throw new Error(`Invoice ${id} is not approved or does not belong to this organization`);
        }
        if (lockedSet.has(id)) {
          throw new Error(`Invoice ${id} is already in a pending nomina`);
        }
      }

      targetInvoices = requestedIds.map((id) => approvedMap.get(id)!);
    } else {
      const { invoices } = await invoiceDb.findAllByOrganization(orgId, 10000, 0, {
        status: 'approved',
      });
      targetInvoices = invoices.filter((inv) => !lockedSet.has(inv.id));
    }

    if (targetInvoices.length === 0) {
      throw new Error('No approved invoices available to create a nomina');
    }

    const totalAmount = targetInvoices.reduce(
      (sum, inv) => sum + (inv.gross_amount ?? 0),
      0,
    );
    const finalInvoiceIds = targetInvoices.map((inv) => inv.id);

    logger.info('Creating nomina', { orgId, invoiceCount: finalInvoiceIds.length, totalAmount });

    const nominaRow = await nominaDb.create({
      organization_id: orgId,
      created_by_user_id: userId,
      status: 'pending',
      total_amount: totalAmount,
      invoice_count: finalInvoiceIds.length,
    });

    await nominaDb.insertNominaInvoices(nominaRow.id, finalInvoiceIds);

    logger.info('Nomina created', { nominaId: nominaRow.id });
    return toPublic(nominaRow, finalInvoiceIds);
  } catch (error) {
    logger.error('Error creating nomina', { error: getErrorMessage(error) });
    throw error;
  }
}
