import { getMyOrgSiiInvoices as getMyOrgSiiInvoicesAction } from '../actions/get-my-org-sii-invoices.js';

type Params = Parameters<typeof getMyOrgSiiInvoicesAction>[0];

export async function getMyOrgSiiInvoices(
  params: Params,
): ReturnType<typeof getMyOrgSiiInvoicesAction> {
  return getMyOrgSiiInvoicesAction(params);
}
