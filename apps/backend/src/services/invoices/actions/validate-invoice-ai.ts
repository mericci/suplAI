/**
 * Validate Invoice with AI Action
 *
 * Compares the invoice amount against the supplier's current cost contract
 * using Claude AI. Sets ai_validation_status + ai_validation_notes on the invoice.
 *
 * Non-blocking: errors set status to 'error' with a generic Spanish note.
 * If no cost contract exists, leaves ai_validation_status as null.
 */

import Anthropic from '@anthropic-ai/sdk';
import * as invoiceDb from '../../../db/invoice.db.js';
import * as supplierDocDb from '../../../db/supplier-document.db.js';
import { logger } from '../../../utils/logger.js';
import { getErrorMessage } from '../../../utils/error.js';

function getAnthropicClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');
  return new Anthropic({ apiKey });
}

async function getUfToCLPRate(): Promise<number | null> {
  try {
    const res = await fetch('https://mindicador.cl/api/uf');
    if (!res.ok) return null;
    const data = await res.json() as { serie: { valor: number }[] };
    return data?.serie?.[0]?.valor ?? null;
  } catch {
    return null;
  }
}

function convertAmountToCLP(amount: number, currency: string, ufRate: number | null): { clp: number; label: string } {
  const cur = currency?.toUpperCase();
  if (cur === 'UF' && ufRate) {
    return { clp: Math.round(amount * ufRate), label: `${amount} UF = ${Math.round(amount * ufRate)} CLP (1 UF = ${ufRate} CLP)` };
  }
  return { clp: amount, label: `${amount} ${currency ?? 'CLP'}` };
}

export async function validateInvoiceAi(
  invoiceId: string,
  organizationId: string,
): Promise<void> {
  try {
    const invoice = await invoiceDb.findById(invoiceId, organizationId);
    if (!invoice) throw new Error('Invoice not found');

    const contract = await supplierDocDb.findCurrentCostContract(invoice.supplier_id);

    if (!contract || !contract.amounts || contract.amounts.length === 0) {
      // No contract or no amounts — leave ai_validation_status as null
      logger.info('AI validation skipped: no cost contract', { invoiceId });
      return;
    }

    const ufRate = await getUfToCLPRate();
    logger.info('AI validation context', {
      invoiceId,
      invoiceGrossAmount: invoice.gross_amount,
      contractAmounts: contract.amounts,
      ufRate,
    });

    const convertedAmounts = contract.amounts.map((a: { amount: number; currency: string; concept?: string; frequency?: string }) => {
      const { clp, label } = convertAmountToCLP(a.amount, a.currency, ufRate);
      return { ...a, clp_equivalent: clp, label };
    });
    logger.info('AI validation converted amounts', { invoiceId, convertedAmounts });

    const prompt = `You are an invoice validation assistant for a Chilean company.
Compare the following invoice against the supplier's cost contract.
All contract amounts have been converted to CLP for comparison.

INVOICE:
- Document type: ${invoice.document_type}
- Document number: ${invoice.document_number}
- Issue date: ${invoice.issue_date}
- Gross amount: ${invoice.gross_amount} CLP

SUPPLIER COST CONTRACT:
- Service description: ${contract.service_description ?? 'N/A'}
- Tariff type: ${contract.tariff_type ?? 'N/A'}
- Amounts (converted to CLP): ${JSON.stringify(convertedAmounts)}
${ufRate ? `- UF rate used: 1 UF = ${ufRate} CLP` : ''}

Allow ±5% tolerance when comparing the invoice gross amount against the contract clp_equivalent amounts.
Respond ONLY with valid JSON (no markdown, no explanation):
{"status": "ok", "notes": "<one sentence in Spanish>"} or {"status": "error", "notes": "<one sentence in Spanish>"}`;

    const message = await getAnthropicClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 256,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') throw new Error('Unexpected AI response type');

    const rawText = content.text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
    logger.info('AI raw response', { invoiceId, rawText });
    const parsed: { status: 'ok' | 'error'; notes: string } = JSON.parse(rawText);

    await invoiceDb.update(invoiceId, organizationId, {
      ai_validation_status: parsed.status,
      ai_validation_notes: parsed.notes,
    } as never);

    logger.info('AI validation complete', { invoiceId, status: parsed.status });
  } catch (error) {
    logger.error('AI validation failed', { invoiceId, error: getErrorMessage(error) });
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
