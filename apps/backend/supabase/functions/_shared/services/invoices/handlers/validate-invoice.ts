import { validateInvoiceAi } from '../actions/validate-invoice-ai.ts';
import * as invoiceDb from '../../../db/invoice.db.ts';
import { toPublic } from '../types/index.ts';
import type { InvoicePublic } from '../types/index.ts';

export async function validateInvoice(
  invoiceId: string,
  organizationId: string,
): Promise<InvoicePublic> {
  await validateInvoiceAi(invoiceId, organizationId);
  const invoice = await invoiceDb.findById(invoiceId, organizationId);
  if (!invoice) throw new Error('Invoice not found');
  return toPublic(invoice);
}
