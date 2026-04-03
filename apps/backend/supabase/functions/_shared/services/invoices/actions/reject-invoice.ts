/**
 * Reject Invoice Action (Edge Function)
 *
 * Transitions invoice status from 'pending' to 'rejected'.
 * Records approvedByUserId (the user who rejected) and approvedAt timestamp.
 *
 * If an organization rule has notifySiiOnReject = true,
 * fires a SII RCD event registration (fire-and-forget).
 */

import { logger } from '../../../utils/logger.ts';
import * as invoiceDb from '../../../db/invoice.db.ts';
import * as orgDb from '../../../db/organization.db.ts';
import * as ruleDb from '../../../db/organization-rule.db.ts';
import * as eventDb from '../../../db/invoice-event.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { toPublic } from '../types/index.ts';
import type { InvoicePublic } from '../types/index.ts';
import { decrypt } from '../../../commons/encryption/index.ts';
import { parseChileanRut } from '../../sii/helpers/parse-rut.ts';
import getSessionTokens from '../../../commons/integrations/sii/get-session-tokens.ts';
import { registerDteEvent } from '../../../commons/integrations/sii/register-dte-event.ts';

async function notifySiiRcd(
  invoiceId: string,
  organizationId: string,
): Promise<void> {
  try {
    const [invoice, org] = await Promise.all([
      invoiceDb.findById(invoiceId, organizationId),
      orgDb.findById(organizationId),
    ]);

    if (!invoice || !org || !org.tax_authority_password_enc || !org.tax_authority_username) {
      logger.warn('SII RCD skipped: missing invoice or org credentials', { invoiceId, organizationId });
      return;
    }

    const password = await decrypt(org.tax_authority_password_enc);
    const { dni, dv } = parseChileanRut(org.tax_identifier);
    const { siiToken } = await getSessionTokens({ taxPayerDni: dni, taxPayerDv: dv, password });

    const { dni: emisorDni, dv: emisorDv } = parseChileanRut(invoice.issuer_tax_identifier);
    const { dni: receptorDni, dv: receptorDv } = parseChileanRut(org.tax_identifier);

    await registerDteEvent({
      rutEmisor: emisorDni,
      dvEmisor: emisorDv,
      rutReceptor: receptorDni,
      dvReceptor: receptorDv,
      tipoDoc: invoice.document_type_number,
      folio: invoice.document_number,
      eventType: 'RCD',
      siiToken,
    });

    logger.info('SII RCD event registered', { invoiceId });
  } catch (error) {
    logger.warn('SII RCD notification failed (non-blocking)', {
      invoiceId,
      error: getErrorMessage(error),
    });
  }
}

export async function rejectInvoice(
  id: string,
  organizationId: string,
  rejectedByUserId: string,
): Promise<InvoicePublic> {
  try {
    logger.info('Rejecting invoice', { invoiceId: id, organizationId, rejectedByUserId });

    const existing = await invoiceDb.findById(id, organizationId);
    if (!existing) throw new Error('Invoice not found');

    if (existing.status !== 'pending') {
      throw new Error(`Invoice cannot be rejected: current status is '${existing.status}'`);
    }

    const invoice = await invoiceDb.update(id, organizationId, {
      status: 'rejected',
      approved_by_user_id: rejectedByUserId,
      approved_at: new Date().toISOString(),
    } as never);

    logger.info('Invoice rejected', { invoiceId: id, rejectedByUserId });

    eventDb.createEvent({
      invoice_id: id,
      organization_id: organizationId,
      event_type: 'rejected',
      actor_user_id: rejectedByUserId,
      metadata: null,
      occurred_at: new Date().toISOString(),
    }).catch((e: unknown) => logger.warn('Failed to record reject event', { error: getErrorMessage(e) }));

    // Fire-and-forget SII notification if configured
    const rule = await ruleDb.findApplicableRule(
      organizationId,
      existing.supplier_id,
      Number(existing.gross_amount),
    ).catch(() => null);

    if (rule?.notify_sii_on_reject) {
      notifySiiRcd(id, organizationId).catch(() => {});
    }

    return toPublic(invoice);
  } catch (error) {
    logger.error('Error rejecting invoice', { error: getErrorMessage(error) });
    throw error;
  }
}
