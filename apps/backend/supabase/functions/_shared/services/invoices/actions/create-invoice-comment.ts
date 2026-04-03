import * as invoiceDb from '../../../db/invoice.db.ts';
import * as commentDb from '../../../db/invoice-comment.db.ts';
import type { InvoiceCommentRow } from '../../../db/invoice-comment.db.ts';

export async function createInvoiceComment(
  invoiceId: string,
  organizationId: string,
  userId: string,
  content: string,
  type: 'comment' | 'rejection' = 'comment',
): Promise<InvoiceCommentRow> {
  const existing = await invoiceDb.findById(invoiceId, organizationId);
  if (!existing) throw new Error('Invoice not found');

  return commentDb.createComment({
    invoice_id: invoiceId,
    organization_id: organizationId,
    user_id: userId,
    content,
    type,
  });
}
