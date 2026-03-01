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

import { decrypt } from '../../../commons/encryption/index.ts';
import * as orgDb from '../../../db/organization.db.ts';
import type { DocumentType } from '../../../db/schemas/invoice.schema.ts';
import getSiiInvoices from '../../sii/actions/get-sii-invoices.ts';
import { parseChileanRut } from '../../sii/helpers/parse-rut.ts';
import { upsertSupplier } from '../../suppliers/actions/upsert-supplier.ts';
import { mapSiiDocumentType } from '../helpers/map-document-type.ts';
import { upsertInvoice } from './upsert-invoice.ts';
import { upsertOrgSupplier } from './upsert-org-supplier.ts';

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

  const password = await decrypt(org.tax_authority_password_enc);
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
      documentType: mapSiiDocumentType(invoice.documentTypeCode) as DocumentType,
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
