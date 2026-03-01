/**
 * Get SII Invoices by Period - Handler
 *
 * Exposes the getSiiInvoicesByPeriod action.
 */

import { getSiiInvoices as getSiiInvoicesAction } from '../actions/index.ts';

type GetSiiInvoicesByPeriodParams = Parameters<typeof getSiiInvoicesAction>[0];

export async function getSiiInvoices(
  params: GetSiiInvoicesByPeriodParams,
): ReturnType<typeof getSiiInvoicesAction> {
  return getSiiInvoicesAction(params);
}
