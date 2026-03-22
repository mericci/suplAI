/**
 * Approve Invoice Action
 *
 * Transitions invoice status from 'pending' to 'approved'.
 * Records approvedByUserId and approvedAt timestamp.
 *
 * If an organization rule has notifySiiOnApprove = true,
 * fires a SII ACD event registration (fire-and-forget).
 */

import { logger } from '../../../utils/logger.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import * as orgDb from '../../../db/organization.db.js';
import * as ruleDb from '../../../db/organization-rule.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { toPublic } from '../types/index.js';
import type { InvoicePublic } from '../types/index.js';
import { decrypt } from '../../../commons/encryption/index.js';
import { parseChileanRut } from '../../sii/helpers/parse-rut.js';
import getSessionTokens from '../../../commons/integrations/sii/get-session-tokens.js';
import { registerDteEvent } from '../../../commons/integrations/sii/register-dte-event.js';

async function notifySiiAcd(
  invoiceId: string,
  organizationId: string,
): Promise<void> {
  try {
    const [invoice, org] = await Promise.all([
      invoiceDb.findById(invoiceId, organizationId),
      orgDb.findById(organizationId),
    ]);

    if (!invoice || !org || !org.tax_authority_password_enc || !org.tax_authority_username) {
      logger.warn('SII ACD skipped: missing invoice or org credentials', { invoiceId, organizationId });
      return;
    }

    const password = decrypt(org.tax_authority_password_enc);
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
      eventType: 'ACD',
      siiToken,
    });

    logger.info('SII ACD event registered', { invoiceId });
  } catch (error) {
    logger.warn('SII ACD notification failed (non-blocking)', {
      invoiceId,
      error: getErrorMessage(error),
    });
  }
}

export async function approveInvoice(
  id: string,
  organizationId: string,
  approvedByUserId: string,
): Promise<InvoicePublic> {
  try {
    logger.info('Approving invoice', {
      invoiceId: id,
      organizationId,
      approvedByUserId,
    });

    const existing = await invoiceDb.findById(id, organizationId);
    if (!existing) throw new Error('Invoice not found');

    if (existing.status !== 'pending') {
      throw new Error(
        `Invoice cannot be approved: current status is '${existing.status}'`,
      );
    }

    const invoice = await invoiceDb.update(id, organizationId, {
      status: 'approved',
      approved_by_user_id: approvedByUserId,
      approved_at: new Date().toISOString(),
    } as never);

    logger.info('Invoice approved', { invoiceId: id, approvedByUserId });

    // Fire-and-forget SII notification if configured
    const rule = await ruleDb.findApplicableRule(
      organizationId,
      existing.supplier_id,
      Number(existing.gross_amount),
    ).catch(() => null);

    if (rule?.notify_sii_on_approve) {
      notifySiiAcd(id, organizationId).catch(() => {
        // already handled inside notifySiiAcd
      });
    }

    return toPublic(invoice);
  } catch (error) {
    logger.error('Error approving invoice', { error: getErrorMessage(error) });
    throw error;
  }
}
