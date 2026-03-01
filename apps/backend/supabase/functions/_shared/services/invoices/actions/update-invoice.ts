/**
 * Update Invoice Action
 *
 * Updates mutable fields on an invoice. Status transitions are validated.
 * Use approve-invoice / reject-invoice actions for approval workflow.
 */

import { logger } from '../../../utils/logger.ts';
import * as invoiceDb from '../../../db/invoice.db.ts';
import { validateUpdateInvoice } from '../../../db/schemas/index.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { toPublic } from '../types/index.ts';
import type { InvoicePublic } from '../types/index.ts';

export async function updateInvoice(
  id: string,
  organizationId: string,
  data: unknown,
): Promise<InvoicePublic> {
  try {
    const validated = validateUpdateInvoice(data);

    logger.info('Updating invoice', { invoiceId: id, organizationId });

    const existing = await invoiceDb.findById(id, organizationId);
    if (!existing) throw new Error('Invoice not found');

    const updates: Record<string, unknown> = {};
    if (validated.status !== undefined) updates.status = validated.status;
    if (validated.dueDate !== undefined) {
      updates.due_date = validated.dueDate
        ? validated.dueDate.toISOString().split('T')[0]
        : null;
    }
    if (validated.approvedByUserId !== undefined) {
      updates.approved_by_user_id = validated.approvedByUserId;
    }
    if (validated.approvedAt !== undefined) {
      updates.approved_at = validated.approvedAt?.toISOString() ?? null;
    }

    const invoice = await invoiceDb.update(
      id,
      organizationId,
      updates as never,
    );

    logger.info('Invoice updated', { invoiceId: id });
    return toPublic(invoice);
  } catch (error) {
    logger.error('Error updating invoice', { error: getErrorMessage(error) });
    throw error;
  }
}
