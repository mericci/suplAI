import { upsertInvoice as upsertInvoiceAction } from '../actions/upsert-invoice.ts';
import type { InvoicePublic } from '../types/index.ts';

export async function upsertInvoice(data: unknown): Promise<InvoicePublic> {
  return upsertInvoiceAction(data);
}
