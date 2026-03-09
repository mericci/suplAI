/**
 * Validate Pending Invoices SII Status
 *
 * For each pending invoice in the organization, queries the SII QueryEventos
 * endpoint to check the commercial acceptance lifecycle events and auto-updates
 * the invoice status to 'approved' or 'rejected' based on the result.
 *
 * Runs per-invoice try/catch — individual failures are logged and skipped,
 * never propagated to fail the whole batch.
 */

import * as invoiceDb from '../../../db/invoice.db.js';
import { checkDteStatus } from '../../../commons/integrations/sii/check-dte-status.js';
import { parseChileanRut } from '../../sii/helpers/parse-rut.js';
import { logger } from '../../../utils/logger.js';
import { getErrorMessage } from '../../../utils/error.js';

export async function validatePendingInvoicesSiiStatus(
  orgId: string,
  siiToken: string,
): Promise<void> {
  const pending = await invoiceDb.findPendingByOrganization(orgId);

  if (pending.length === 0) {
    logger.info('No pending invoices to validate', { orgId });
    return;
  }

  logger.info('Validating pending SII invoice statuses', {
    orgId,
    count: pending.length,
  });

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  for (const invoice of pending) {
    try {
      const { dni: rutEmisor, dv: dvEmisor } = parseChileanRut(
        invoice.issuer_tax_identifier,
      );

      const { status } = await checkDteStatus({
        rutEmisor,
        dvEmisor,
        tipoDoc: invoice.document_type_number,
        folio: invoice.document_number,
        siiToken,
      });

      if (status === 'pending') {
        skipped++;
        continue;
      }

      await invoiceDb.update(invoice.id, orgId, { status });
      logger.info('Invoice status updated from SII events', {
        invoiceId: invoice.id,
        documentNumber: invoice.document_number,
        status,
      });
      updated++;
    } catch (error) {
      logger.warn('Failed to validate SII status for invoice — skipping', {
        invoiceId: invoice.id,
        documentNumber: invoice.document_number,
        error: getErrorMessage(error),
      });
      failed++;
    }
  }

  logger.info('SII status validation complete', {
    orgId,
    updated,
    skipped,
    failed,
  });
}
