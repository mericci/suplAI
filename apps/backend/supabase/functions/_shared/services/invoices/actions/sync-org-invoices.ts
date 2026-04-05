/**
 * Sync Org Invoices Action (Edge Function)
 *
 * Transparently syncs invoices from SII (Chile's tax authority) for an organization.
 * Also processes mérito (título ejecutivo) rules for pending invoices.
 *
 * Errors are caught and logged — SII sync is best-effort and never fails the list endpoint.
 */

import { logger } from '../../../utils/logger.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { decrypt } from '../../../commons/encryption/index.ts';
import { supabase } from '../../../lib/supabase.ts';
import * as orgDb from '../../../db/organization.db.ts';
import * as invoiceDb from '../../../db/invoice.db.ts';
import * as ruleDb from '../../../db/organization-rule.db.ts';
import { parseChileanRut } from '../../sii/helpers/parse-rut.ts';
import getSiiInvoices from '../../sii/actions/get-sii-invoices.ts';
import { upsertSupplier } from '../../suppliers/actions/upsert-supplier.ts';
import { upsertOrgSupplier } from './upsert-org-supplier.ts';
import { upsertInvoice } from './upsert-invoice.ts';
import { validateInvoiceAi } from './validate-invoice-ai.ts';
import { fetchInvoiceDteXml } from './fetch-invoice-dte-xml.ts';
import { rejectInvoice } from './reject-invoice.ts';
import { approveInvoice } from './approve-invoice.ts';
import { sendEmail } from '../../../commons/email/send-email.ts';

const MERITO_ACTION_USER_ID = 'system';

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

  const latestPeriod = latestIssueDate.substring(0, 7);
  return { from: latestPeriod, to };
}

function daysUntilDate(dateStr: string): number {
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

async function processMeritoForInvoice(
  invoice: { id: string; supplier_id: string; gross_amount: number; executive_title_date: string | null; document_number: string },
  orgId: string,
): Promise<void> {
  if (!invoice.executive_title_date) return;

  const rule = await ruleDb.findApplicableRule(
    orgId,
    invoice.supplier_id,
    Number(invoice.gross_amount),
  ).catch(() => null);

  if (!rule) return;

  const daysLeft = daysUntilDate(invoice.executive_title_date);

  if (daysLeft < 0) {
    if (rule.merito_completed_action === 'auto_approve') {
      try {
        await approveInvoice(invoice.id, orgId, MERITO_ACTION_USER_ID);
        logger.info('Invoice auto-approved (merito completed)', { invoiceId: invoice.id });
      } catch (err) {
        logger.warn('Failed to auto-approve invoice after mérito', {
          invoiceId: invoice.id,
          error: getErrorMessage(err),
        });
      }
    }
    return;
  }

  const actionDaysBefore = rule.merito_days_before ?? 0;
  if (rule.merito_action !== 'nothing' && daysLeft <= actionDaysBefore) {
    try {
      if (rule.merito_action === 'reject_sii_and_supl' || rule.merito_action === 'reject_supl_only') {
        await rejectInvoice(invoice.id, orgId, MERITO_ACTION_USER_ID);
        logger.info('Invoice rejected by merito rule', {
          invoiceId: invoice.id,
          meritoAction: rule.merito_action,
          daysLeft,
        });
      }
    } catch (err) {
      logger.warn('Failed to execute merito action on invoice', {
        invoiceId: invoice.id,
        error: getErrorMessage(err),
      });
    }
  }

  if (rule.merito_alert_enabled && rule.merito_alert_emails && rule.merito_alert_emails.length > 0) {
    const alertDaysBefore = rule.merito_alert_days_before ?? 0;
    if (daysLeft <= alertDaysBefore) {
      const subject = `Alerta: Título Ejecutivo próximo — Factura ${invoice.document_number}`;
      const html = `
        <p>La factura <strong>${invoice.document_number}</strong> alcanzará su título ejecutivo en <strong>${daysLeft} día(s)</strong>.</p>
        <p>Fecha de título ejecutivo: ${invoice.executive_title_date}</p>
        <p>Por favor revise y tome acción si es necesario.</p>
      `;
      sendEmail({
        to: rule.merito_alert_emails,
        subject,
        html,
      }).catch(() => {});
    }
  }
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

    const password = await decrypt(org.tax_authority_password_enc);
    const { dni, dv } = parseChileanRut(org.tax_identifier);

    const { invoices, siiToken, cookieString } = await getSiiInvoices({
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

      const upserted = await upsertInvoice({
        organizationId: orgId,
        supplierId: supplier.id,
        issuerTaxIdentifier: supplierTaxIdentifier,
        receiverTaxIdentifier: org.tax_identifier,
        documentType: invoice.documentType,
        documentTypeNumber: invoice.documentTypeNumber,
        documentNumber: invoice.documentNumber,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
        status: 'pending',
        netAmount: invoice.netAmount,
        taxAmount: invoice.taxAmount,
        grossAmount: invoice.grossAmount,
      });

      if (upserted.status === 'pending' && upserted.aiValidationStatus === null) {
        validateInvoiceAi(upserted.id, orgId).catch((err) => {
          logger.warn('AI validation fire-and-forget error', { error: getErrorMessage(err) });
        });
      }

      fetchInvoiceDteXml({
        invoiceId: upserted.id,
        organizationId: orgId,
        siiToken,
        cookieString,
        receiverDni: dni,
        receiverDv: dv,
        documentTypeNumber: invoice.documentTypeNumber,
        documentNumber: invoice.documentNumber,
        issuerTaxIdentifier: upserted.issuer_tax_identifier,
      }).catch((err) => {
        logger.warn('DTE XML fetch fire-and-forget error', { error: getErrorMessage(err) });
      });
    }

    // Process mérito rules for all pending invoices
    const pendingInvoices = await invoiceDb.findPendingByOrganization(orgId);
    for (const inv of pendingInvoices) {
      processMeritoForInvoice(
        {
          id: inv.id,
          supplier_id: inv.supplier_id,
          gross_amount: Number(inv.gross_amount),
          executive_title_date: (inv as unknown as { executive_title_date: string | null }).executive_title_date,
          document_number: inv.document_number,
        },
        orgId,
      ).catch((err) => {
        logger.warn('Mérito processing error for invoice', {
          invoiceId: inv.id,
          error: getErrorMessage(err),
        });
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
