import * as invoiceDb from '../../../db/invoice.db.ts';
import * as commentDb from '../../../db/invoice-comment.db.ts';
import type { InvoiceCommentRow } from '../../../db/invoice-comment.db.ts';

export async function getInvoiceComments(
  id: string,
  organizationId: string,
): Promise<InvoiceCommentRow[]> {
  const existing = await invoiceDb.findById(id, organizationId);
  if (!existing) throw new Error('Invoice not found');

  return commentDb.findCommentsByInvoiceId(id, organizationId);
}
