import {
  createInvoiceDistributions as createInvoiceDistributionsAction,
} from '../actions/create-invoice-distributions.js';
import type { CreateInvoiceDistributionsPayload } from '../actions/create-invoice-distributions.js';

export async function createInvoiceDistributions(
  invoiceId: string,
  organizationId: string,
  payload: CreateInvoiceDistributionsPayload,
): ReturnType<typeof createInvoiceDistributionsAction> {
  return createInvoiceDistributionsAction(invoiceId, organizationId, payload);
}
