/**
 * Import Org Invoices Action
 *
 * Fetches invoices from SII (Chile's tax authority) for an organization
 * for a given period and persists them to the database.
 *
 * Unlike syncOrgInvoices (which is transparent and best-effort),
 * this action is user-initiated and returns the count of imported invoices.
 * Errors are propagated to the caller.
 */

import { decrypt } from '../../../commons/encryption/index.js';
import * as orgDb from '../../../db/organization.db.js';
import getSiiInvoices from '../../sii/actions/get-sii-invoices.js';
import { parseChileanRut } from '../../sii/helpers/parse-rut.js';
import { upsertSupplier } from '../../suppliers/actions/upsert-supplier.js';
import { upsertInvoice } from './upsert-invoice.js';
import { upsertOrgSupplier } from './upsert-org-supplier.js';

export interface ImportOrgInvoicesParams {
  orgId: string;
  from: string;
  defaultStatus: 'pending' | 'approved' | 'rejected';
}

export async function importOrgInvoices(
  params: ImportOrgInvoicesParams,
): Promise<number> {
  const { orgId, from, defaultStatus } = params;

  const org = await orgDb.findById(orgId);

  if (!org) {
    throw Object.assign(new Error('Organization not found'), {
      code: 'NOT_FOUND',
    });
  }

  if (!org.tax_authority_password_enc) {
    throw Object.assign(
      new Error('Organization has no SII credentials configured'),
      { code: 'VALIDATION_ERROR' },
    );
  }

  const password = decrypt(org.tax_authority_password_enc);
  const { dni, dv } = parseChileanRut(org.tax_identifier);

  const now = new Date();
  const to = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const { invoices } = await getSiiInvoices({
    taxPayerDni: dni,
    taxPayerDv: dv,
    password,
    from,
    to,
  });

  for (const invoice of invoices) {
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
      documentType: invoice.documentType,
      documentTypeNumber: invoice.documentTypeNumber,
      documentNumber: invoice.documentNumber,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      status: defaultStatus,
      netAmount: invoice.netAmount,
      taxAmount: invoice.taxAmount,
      grossAmount: invoice.grossAmount,
    });
  }

  return invoices.length;
}
