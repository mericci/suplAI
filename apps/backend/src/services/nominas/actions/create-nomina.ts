/**
 * Create Nomina Action
 *
 * Creates a nomina from approved invoices (optionally a specific subset).
 * Invoices already in a pending nomina are excluded/rejected.
 */

import { logger } from '../../../utils/logger.js';
import * as nominaDb from '../../../db/nomina.db.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import * as eventDb from '../../../db/invoice-event.db.js';
import { CreateNominaSchema } from '../../../db/schemas/nomina.schema.js';
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

export async function createNomina(
  orgId: string,
  userId: string,
  rawData: unknown,
): Promise<NominaWithInvoiceIds> {
  try {
    const { invoiceIds: requestedIds } = CreateNominaSchema.parse(rawData);

    // Get IDs locked in pending nominas
    const lockedIds = await nominaDb.findLockedInvoiceIds(orgId);
    const lockedSet = new Set(lockedIds);

    let targetInvoices: Awaited<ReturnType<typeof invoiceDb.findAllByOrganization>>['invoices'];

    if (requestedIds.length > 0) {
      // Validate requested invoices: must be approved and not locked
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
      // Use all approved invoices, excluding locked ones
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

    // Record nomina_associated events for all invoices (fire-and-forget)
    const now = new Date().toISOString();
    eventDb.createEvents(
      finalInvoiceIds.map((invoiceId) => ({
        invoice_id: invoiceId,
        organization_id: orgId,
        event_type: 'nomina_associated',
        actor_user_id: userId,
        metadata: { nomina_id: nominaRow.id } as never,
        occurred_at: now,
      })),
    ).catch((e) => logger.warn('Failed to record nomina_associated events', { error: getErrorMessage(e) }));

    logger.info('Nomina created', { nominaId: nominaRow.id });
    return toPublic(nominaRow, finalInvoiceIds);
  } catch (error) {
    logger.error('Error creating nomina', { error: getErrorMessage(error) });
    throw error;
  }
}
