import { logger } from '../../../utils/logger.js';
import * as organizationDb from '../../../db/organization.db.js';
import { decrypt } from '../../../commons/encryption/index.js';
import { getSiiSessionTokens } from '../../../commons/integrations/sii/index.js';
import registerDteEvent, {
  type DteAction,
} from '../../../commons/integrations/sii/register-dte-event.js';
import { parseChileanRut } from '../../sii/helpers/parse-rut.js';
import type { Database } from '../../../types/supabase.js';

type InvoiceRow = Database['public']['Tables']['invoices']['Row'];

// Maps our internal document type to the canonical SII tipoDoc numeric code.
const DOCUMENT_TYPE_TO_SII_CODE: Record<string, number> = {
  invoice: 33,
  receipt: 39,
  debit_note: 56,
  credit_note: 61,
};

/**
 * Best-effort: notify SII of an ACD or RCD event for the given invoice.
 *
 * Silently skips if the organisation has no SII credentials stored.
 * Throws if credentials exist but the SII call fails — callers should .catch()
 * and log the error rather than letting it propagate.
 */
export async function notifySiiDteEvent(
  organizationId: string,
  invoice: InvoiceRow,
  accionDoc: DteAction,
): Promise<void> {
  const org = await organizationDb.findById(organizationId);
  if (!org?.tax_authority_password_enc) {
    logger.info('Skipping SII DTE notification: no credentials configured', {
      organizationId,
      accionDoc,
    });
    return;
  }

  const password = decrypt(org.tax_authority_password_enc);

  const { dni: taxPayerDni, dv: taxPayerDv } = parseChileanRut(
    org.tax_identifier,
  );
  const { siiToken, client } = await getSiiSessionTokens({
    taxPayerDni,
    taxPayerDv,
    password,
  });

  const { dni: rutEmisorStr, dv: dvEmisor } = parseChileanRut(
    invoice.issuer_tax_identifier,
  );
  const rutEmisor = parseInt(rutEmisorStr, 10);
  const tipoDoc = DOCUMENT_TYPE_TO_SII_CODE[invoice.document_type] ?? 33;
  const folio = Number(invoice.document_number);

  await registerDteEvent({
    client,
    siiToken,
    rutEmisor,
    dvEmisor,
    tipoDoc,
    folio,
    accionDoc,
  });

  logger.info('SII DTE event registered', {
    organizationId,
    invoiceId: invoice.id,
    accionDoc,
    tipoDoc,
    folio,
  });
}
