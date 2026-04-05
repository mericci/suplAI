/**
 * Fetch Invoice DTE XML Action (Edge Function)
 *
 * Best-effort: fetches the DTE XML from SII and stores it on the invoice.
 * Idempotent: skips invoices that already have dte_xml set (enforced by DB IS NULL guard).
 * Never throws — caller must wrap in .catch() if fire-and-forget.
 */

import { logger } from '../../../utils/logger.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import * as invoiceDb from '../../../db/invoice.db.ts';
import getDteXml from '../../../commons/integrations/sii/get-dte-xml.ts';
import { parseChileanRut } from '../../sii/helpers/parse-rut.ts';

export interface FetchInvoiceDteXmlParams {
  invoiceId: string;
  organizationId: string;
  siiToken: string;
  cookieString: string;
  /** Receiver (org) RUT digits — no DV, no dots */
  receiverDni: string;
  receiverDv: string;
  documentTypeNumber: number;
  documentNumber: string;
  /** Formatted RUT of the issuer (supplier), e.g. "12345678-9" */
  issuerTaxIdentifier: string;
}

export async function fetchInvoiceDteXml(
  params: FetchInvoiceDteXmlParams,
): Promise<void> {
  const {
    invoiceId,
    organizationId,
    siiToken,
    cookieString,
    receiverDni,
    receiverDv,
    documentTypeNumber,
    documentNumber,
    issuerTaxIdentifier,
  } = params;

  // Skip if XML already stored — also enforced by DB IS NULL guard in updateDteXml
  const existing = await invoiceDb.findById(invoiceId, organizationId);
  if (!existing || (existing as unknown as { dte_xml: string | null }).dte_xml !== null) {
    return;
  }

  let issuerDni: string;
  let issuerDv: string;
  try {
    const parsed = parseChileanRut(issuerTaxIdentifier);
    issuerDni = parsed.dni;
    issuerDv = parsed.dv;
  } catch {
    logger.warn('fetchInvoiceDteXml: invalid issuerTaxIdentifier, skipping', {
      invoiceId,
      issuerTaxIdentifier,
    });
    return;
  }

  const xml = await getDteXml({
    cookieString,
    siiToken,
    taxPayerDni: receiverDni,
    taxPayerDv: receiverDv,
    issuerDni,
    issuerDv,
    documentTypeNumber,
    documentNumber,
  });

  if (!xml) {
    logger.debug('fetchInvoiceDteXml: no XML returned from SII', {
      invoiceId,
      documentTypeNumber,
      documentNumber,
    });
    return;
  }

  await invoiceDb.updateDteXml(invoiceId, organizationId, xml);

  logger.info('fetchInvoiceDteXml: XML stored', {
    invoiceId,
    documentTypeNumber,
    documentNumber,
    xmlLength: xml.length,
  });
}
