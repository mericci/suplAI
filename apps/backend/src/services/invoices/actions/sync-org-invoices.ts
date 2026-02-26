/**
 * Sync Org Invoices Action
 *
 * Transparently syncs invoices from SII (Chile's tax authority) for an organization
 * before the list endpoint returns its results.
 *
 * Period determination:
 *   - No invoices in DB  → fetch from (currentYear - 1)-01 to current month
 *   - Latest same month  → fetch current month only
 *   - Latest earlier     → fetch from latest invoice month to current month (inclusive)
 *
 * Errors are caught and logged — SII sync is best-effort and never fails the list endpoint.
 */

import { logger } from '../../../utils/logger.js';
import { getErrorMessage } from '../../../utils/error.js';
import { decrypt } from '../../../commons/encryption/index.js';
import { supabase } from '../../../lib/supabase.js';
import * as orgDb from '../../../db/organization.db.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import { parseChileanRut } from '../../sii/helpers/parse-rut.js';
import getSiiInvoices from '../../sii/actions/get-sii-invoices.js';
import { upsertSupplier } from '../../suppliers/actions/upsert-supplier.js';
import { upsertOrgSupplier } from './upsert-org-supplier.js';
import { upsertInvoice } from './upsert-invoice.js';
import { mapSiiDocumentType } from '../helpers/map-document-type.js';

function currentPeriod(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function determinePeriods(latestIssueDate: string | null): {
  from: string;
  to: string;
} {
  const to = currentPeriod();

  if (!latestIssueDate) {
    const now = new Date();
    const fourMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    const from = `${fourMonthsAgo.getFullYear()}-${String(fourMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
    return { from, to };
  }

  // issueDate is YYYY-MM-DD — extract YYYY-MM
  const latestPeriod = latestIssueDate.substring(0, 7);
  return { from: latestPeriod, to };
}

export async function syncOrgInvoices(orgId: string): Promise<void> {
  try {
    const org = await orgDb.findById(orgId);

    if (!org || !org.tax_authority_password_enc) {
      logger.info('Skipping SII sync: no credentials configured', { orgId });
      return;
    }

    const latestInvoice = await invoiceDb.findLatestByOrganization(orgId);
    const latestIssueDate = latestInvoice?.issue_date ?? null;
    const { from, to } = determinePeriods(latestIssueDate);

    logger.info('Starting SII sync', { orgId, from, to });

    const password = decrypt(org.tax_authority_password_enc);
    const { dni, dv } = parseChileanRut(org.tax_identifier);

    const { invoices } = await getSiiInvoices({
      taxPayerDni: dni,
      taxPayerDv: dv,
      password,
      from,
      to,
    });

    logger.info('SII invoices fetched', { orgId, count: invoices.length });

    for (const invoice of invoices) {
      // For received invoices, SII returns the supplier's data in the receiver fields
      // (rutReceptor/rznSocRecep) and leaves emisor fields empty.
      const supplierTaxIdentifier = invoice.receiverTaxIdentifier;
      const supplierName = invoice.receiverName;

      const supplier = await upsertSupplier({
        legalName: supplierName,
        taxIdentifier: supplierTaxIdentifier,
      });

      await upsertOrgSupplier(orgId, supplier.id);

      await upsertInvoice({
        organizationId: orgId,
        supplierId: supplier.id,
        issuerTaxIdentifier: supplierTaxIdentifier,
        receiverTaxIdentifier: org.tax_identifier,
        documentType: mapSiiDocumentType(invoice.documentTypeCode),
        documentNumber: invoice.documentNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: 'pending',
        netAmount: invoice.netAmount,
        taxAmount: invoice.taxAmount,
        grossAmount: invoice.grossAmount,
      });
    }

    // Record the time of this successful sync
    await supabase
      .from('organizations')
      .update({ last_sii_sync_at: new Date().toISOString() } as never)
      .eq('id', orgId);

    logger.info('SII sync complete', { orgId, synced: invoices.length });
  } catch (error) {
    logger.error('SII sync failed — returning existing DB data', {
      orgId,
      error: getErrorMessage(error),
    });
  }
}
