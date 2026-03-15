import { validateInvoiceAi } from '../actions/validate-invoice-ai.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import { toPublic } from '../types/index.js';
import type { InvoicePublic } from '../types/index.js';

export async function validateInvoice(
  invoiceId: string,
  organizationId: string,
): Promise<InvoicePublic> {
  await validateInvoiceAi(invoiceId, organizationId);
  const invoice = await invoiceDb.findById(invoiceId, organizationId);
  if (!invoice) throw new Error('Invoice not found');
  return toPublic(invoice);
}
