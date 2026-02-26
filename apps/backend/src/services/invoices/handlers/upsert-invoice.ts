import { upsertInvoice as upsertInvoiceAction } from '../actions/upsert-invoice.js';
import type { InvoicePublic } from '../types/index.js';

export async function upsertInvoice(data: unknown): Promise<InvoicePublic> {
  return upsertInvoiceAction(data);
}
