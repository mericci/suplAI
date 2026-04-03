import * as invoiceDb from '../../../db/invoice.db.ts';
import * as docDb from '../../../db/invoice-document.db.ts';
import type { InvoiceDocumentRow } from '../../../db/invoice-document.db.ts';

export async function getInvoiceDocuments(
  id: string,
  organizationId: string,
): Promise<InvoiceDocumentRow[]> {
  const existing = await invoiceDb.findById(id, organizationId);
  if (!existing) throw new Error('Invoice not found');

  return docDb.findDocumentsByInvoiceId(id, organizationId);
}
