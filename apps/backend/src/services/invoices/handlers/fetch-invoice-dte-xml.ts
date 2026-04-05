/**
 * Handler: fetch DTE XML for a specific invoice on demand.
 *
 * Authenticates with SII using the org's stored credentials, fetches the XML,
 * stores it, and returns the updated invoice.
 */

import * as invoiceDb from '../../../db/invoice.db.js';
import * as orgDb from '../../../db/organization.db.js';
import { decrypt } from '../../../commons/encryption/index.js';
import { getSiiSessionTokens } from '../../../commons/integrations/sii/index.js';
import getDteXml from '../../../commons/integrations/sii/get-dte-xml.js';
import { parseChileanRut } from '../../sii/helpers/parse-rut.js';
import { toPublic } from '../types/index.js';
import type { InvoicePublic } from '../types/index.js';

export async function fetchInvoiceDteXmlHandler(
  invoiceId: string,
  organizationId: string,
): Promise<InvoicePublic> {
  const invoice = await invoiceDb.findById(invoiceId, organizationId);
  if (!invoice) throw Object.assign(new Error('Invoice not found'), { code: 'NOT_FOUND' });

  const org = await orgDb.findById(organizationId);
  if (!org) throw Object.assign(new Error('Organization not found'), { code: 'NOT_FOUND' });
  if (!org.tax_authority_password_enc) {
    throw Object.assign(new Error('No SII credentials configured for this organization'), { code: 'VALIDATION_ERROR' });
  }

  const password = decrypt(org.tax_authority_password_enc);
  const { dni: receiverDni, dv: receiverDv } = parseChileanRut(org.tax_identifier);
  const { dni: issuerDni, dv: issuerDv } = parseChileanRut(invoice.issuer_tax_identifier);

  const sessionTokens = await getSiiSessionTokens({
    taxPayerDni: receiverDni,
    taxPayerDv: receiverDv,
    password,
  });

  const xml = await getDteXml({
    client: sessionTokens.client,
    siiToken: sessionTokens.siiToken,
    taxPayerDni: receiverDni,
    taxPayerDv: receiverDv,
    issuerDni,
    issuerDv,
    documentTypeNumber: invoice.document_type_number,
    documentNumber: invoice.document_number,
  });

  if (xml) {
    await invoiceDb.updateDteXml(invoiceId, organizationId, xml);
  }

  const updated = await invoiceDb.findById(invoiceId, organizationId);
  if (!updated) throw new Error('Invoice not found after update');
  return toPublic(updated);
}
