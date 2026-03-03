/**
 * Upsert Invoice Action
 *
 * Idempotent sync from the external tax authority system.
 * Computes the externalUniqueKey, then:
 *   - If invoice exists for this org → update mutable fields
 *   - If not → create a new record
 *
 * executiveTitleDate is a generated column (issue_date + 8 days) — never set manually.
 */

import { logger } from '../../../utils/logger.ts';
import * as invoiceDb from '../../../db/invoice.db.ts';
import { validateUpsertInvoice } from '../../../db/schemas/index.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { computeExternalUniqueKey } from '../helpers/external-key.ts';
import { toPublic } from '../types/index.ts';
import type { InvoicePublic } from '../types/index.ts';

export async function upsertInvoice(data: unknown): Promise<InvoicePublic> {
  try {
    const validated = validateUpsertInvoice(data);

    const externalUniqueKey = await computeExternalUniqueKey({
      receiverTaxIdentifier: validated.receiverTaxIdentifier,
      issuerTaxIdentifier: validated.issuerTaxIdentifier,
      documentType: validated.documentType,
      documentNumber: validated.documentNumber,
    });

    logger.info('Upserting invoice', {
      organizationId: validated.organizationId,
      externalUniqueKey,
    });

    const existing = await invoiceDb.findByExternalKey(
      externalUniqueKey,
      validated.organizationId,
    );

    if (existing) {
      // Never downgrade status — preserve approved/rejected/paid when syncing from SII
      const statusToSet = existing.status === 'pending' ? validated.status : existing.status;
      const updated = await invoiceDb.update(
        existing.id,
        validated.organizationId,
        {
          due_date: validated.dueDate
            ? validated.dueDate.toISOString().split('T')[0]
            : null,
          status: statusToSet,
          net_amount: validated.netAmount ?? null,
          tax_amount: validated.taxAmount ?? null,
          gross_amount: validated.grossAmount ?? null,
        } as never,
      );
      logger.info('Invoice updated (upsert)', { invoiceId: existing.id });
      return toPublic(updated);
    }

    const invoice = await invoiceDb.create({
      organization_id: validated.organizationId,
      supplier_id: validated.supplierId,
      external_unique_key: externalUniqueKey,
      issuer_tax_identifier: validated.issuerTaxIdentifier,
      receiver_tax_identifier: validated.receiverTaxIdentifier,
      document_type: validated.documentType,
      document_type_number: validated.documentTypeNumber,
      document_number: validated.documentNumber,
      issue_date: validated.issueDate.toISOString().split('T')[0] as string,
      due_date: validated.dueDate
        ? validated.dueDate.toISOString().split('T')[0]
        : null,
      status: validated.status,
      net_amount: validated.netAmount ?? null,
      tax_amount: validated.taxAmount ?? null,
      gross_amount: validated.grossAmount ?? null,
    });

    logger.info('Invoice created (upsert)', { invoiceId: invoice.id });
    return toPublic(invoice);
  } catch (error) {
    logger.error('Error upserting invoice', { error: getErrorMessage(error) });
    throw error;
  }
}
