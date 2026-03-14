/**
 * Validate Invoice with AI Action (Edge Function)
 *
 * Compares the invoice amount against the supplier's current cost contract
 * using Claude AI. Sets ai_validation_status + ai_validation_notes on the invoice.
 *
 * Non-blocking: errors set status to 'error' with a generic Spanish note.
 * If no cost contract exists, leaves ai_validation_status as null.
 */

import Anthropic from '@anthropic-ai/sdk';
import * as invoiceDb from '../../../db/invoice.db.ts';
import * as supplierDocDb from '../../../db/supplier-document.db.ts';
import { logger } from '../../../utils/logger.ts';
import { getErrorMessage } from '../../../utils/error.ts';

export async function validateInvoiceAi(
  invoiceId: string,
  organizationId: string,
): Promise<void> {
  const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });

  try {
    const invoice = await invoiceDb.findById(invoiceId, organizationId);
    if (!invoice) throw new Error('Invoice not found');

    const contract = await supplierDocDb.findCurrentCostContract(invoice.supplier_id);

    if (!contract || !contract.amounts || contract.amounts.length === 0) {
      // No contract or no amounts — leave ai_validation_status as null
      logger.info('AI validation skipped: no cost contract', { invoiceId });
      return;
    }

    const prompt = `You are an invoice validation assistant for a Chilean company.
Compare the following invoice against the supplier's cost contract.

INVOICE:
- Document type: ${invoice.document_type}
- Document number: ${invoice.document_number}
- Issue date: ${invoice.issue_date}
- Gross amount: ${invoice.gross_amount} CLP

SUPPLIER COST CONTRACT:
- Service description: ${contract.service_description ?? 'N/A'}
- Tariff type: ${contract.tariff_type ?? 'N/A'}
- Amounts: ${JSON.stringify(contract.amounts)}

Allow ±5% tolerance on amounts. Respond ONLY with valid JSON (no markdown, no explanation):
{"status": "ok", "notes": "<one sentence in Spanish>"} or {"status": "error", "notes": "<one sentence in Spanish>"}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected AI response type');

    const rawText = content.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    const parsed: { status: 'ok' | 'error'; notes: string } = JSON.parse(rawText);

    await invoiceDb.update(invoiceId, organizationId, {
      ai_validation_status: parsed.status,
      ai_validation_notes: parsed.notes,
    } as never);

    logger.info('AI validation complete', { invoiceId, status: parsed.status });
  } catch (error) {
    logger.warn('AI validation failed', { invoiceId, error: getErrorMessage(error) });
    try {
      await invoiceDb.update(invoiceId, organizationId, {
        ai_validation_status: 'error',
        ai_validation_notes: 'Error al realizar la validación automática.',
      } as never);
    } catch (updateError) {
      logger.error('Failed to update AI validation status after error', {
        invoiceId,
        error: getErrorMessage(updateError),
      });
    }
  }
}
