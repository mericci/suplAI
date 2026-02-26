import { syncOrgInvoices } from '../actions/sync-org-invoices.js';

export async function syncInvoices(organizationId: string): Promise<void> {
  return syncOrgInvoices(organizationId);
}
