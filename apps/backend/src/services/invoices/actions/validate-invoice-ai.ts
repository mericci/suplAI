/**
 * Validate Invoice with AI Action
 *
 * Compares the invoice amount against the supplier's current cost contract
 * using Claude AI. Sets ai_validation_status + ai_validation_notes on the invoice.
 *
 * Non-blocking: errors set status to 'error' with a generic Spanish note.
 * If no cost contract exists, leaves ai_validation_status as null.
 *
 * Reads aiTolerancePct and aiMaxAmount from the applicable organization rule.
 * If aiApproveAction = 'mark_approved' and AI status is 'ok', auto-approves.
 */

import Anthropic from '@anthropic-ai/sdk';
import { anthropicModels } from '../../../commons/integrations/anthropic/index.js';
import { buildValidateInvoicePrompt } from '../prompts/index.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import * as supplierDocDb from '../../../db/supplier-document.db.js';
import * as ruleDb from '../../../db/organization-rule.db.js';
import { logger } from '../../../utils/logger.js';
import { getErrorMessage } from '../../../utils/error.js';
import { approveInvoice } from './approve-invoice.js';

const AI_AUTO_APPROVE_USER_ID = 'system';

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

    const grossAmount = Number(invoice.gross_amount);

    // Fetch applicable rule for tolerance and max amount config
    const rule = await ruleDb.findApplicableRule(
      organizationId,
      invoice.supplier_id,
      grossAmount,
    ).catch(() => null);

    const aiTolerancePct = rule?.ai_tolerance_pct ?? 5;
    const aiMaxAmount = rule?.ai_max_amount != null ? Number(rule.ai_max_amount) : null;
    const aiApproveAction = rule?.ai_approve_action ?? 'nothing';

    // Skip AI if invoice exceeds configured max amount for AI validation
    if (aiMaxAmount != null && grossAmount > aiMaxAmount) {
      logger.info('AI validation skipped: invoice exceeds ai_max_amount', {
        invoiceId,
        grossAmount,
        aiMaxAmount,
      });
      return;
    }

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
      aiTolerancePct,
    });

    const convertedAmounts = contract.amounts.map((a: { amount: number; currency: string; concept?: string; frequency?: string }) => {
      const { clp, label } = convertAmountToCLP(a.amount, a.currency, ufRate);
      return { ...a, clp_equivalent: clp, label };
    });
    logger.info('AI validation converted amounts', { invoiceId, convertedAmounts });

    const prompt = buildValidateInvoicePrompt({
      invoice,
      contract,
      convertedAmounts,
      aiTolerancePct,
      ufRate,
    });

    const message = await getAnthropicClient().messages.create({
      model: anthropicModels.haiku45,
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

    // Auto-approve if configured and AI approved
    if (parsed.status === 'ok' && aiApproveAction === 'mark_approved') {
      try {
        // Re-fetch to confirm still pending
        const current = await invoiceDb.findById(invoiceId, organizationId);
        if (current?.status === 'pending') {
          await approveInvoice(invoiceId, organizationId, AI_AUTO_APPROVE_USER_ID);
          logger.info('Invoice auto-approved by AI', { invoiceId });
        }
      } catch (autoApproveError) {
        logger.warn('AI auto-approve failed (non-blocking)', {
          invoiceId,
          error: getErrorMessage(autoApproveError),
        });
      }
    }
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
