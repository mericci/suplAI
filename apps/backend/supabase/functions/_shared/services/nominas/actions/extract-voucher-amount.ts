/**
 * Extract Voucher Amount Action (Edge Function)
 *
 * Uses Deno.env for API key and fetch (native in Deno).
 */

import { logger } from '../../../utils/logger.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { callAnthropicMessages, anthropicModels } from '../../../commons/integrations/anthropic/index.ts';
import { extractVoucherAmountPrompt } from '../prompts/index.ts';

export async function extractVoucherAmount(
  fileBytes: Uint8Array,
  mimeType: string,
): Promise<number> {
  // Chunked base64 to avoid stack overflow on large files in Deno
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < fileBytes.length; i += chunkSize) {
    binary += String.fromCharCode(...fileBytes.subarray(i, i + chunkSize));
  }
  const base64Data = btoa(binary);

  let contentBlock: Record<string, unknown>;
  if (mimeType === 'application/pdf') {
    contentBlock = {
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: base64Data,
      },
    };
  } else if (mimeType.startsWith('image/')) {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const effectiveMimeType = validImageTypes.includes(mimeType) ? mimeType : 'image/jpeg';
    contentBlock = {
      type: 'image',
      source: {
        type: 'base64',
        media_type: effectiveMimeType,
        data: base64Data,
      },
    };
  } else {
    throw new Error(`Unsupported file type: ${mimeType}`);
  }

  logger.info('Calling Claude API for voucher amount extraction', { mimeType });

  const result = await callAnthropicMessages({
    model: anthropicModels.sonnet46,
    max_tokens: 256,
    system: extractVoucherAmountPrompt,
    messages: [
      {
        role: 'user',
        content: [
          contentBlock,
          {
            type: 'text',
            text: 'Extrae el monto total de la transferencia de este comprobante de pago.',
          },
        ],
      },
    ],
  });

  const textBlock = result.content.find((b) => b.type === 'text') as { type: string; text: string } | undefined;
  if (!textBlock) {
    throw new Error('No text response from Claude API');
  }

  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    const parsed = JSON.parse(jsonMatch[0]) as { amount: number | null };

    if (parsed.amount === null || parsed.amount === undefined) {
      throw new Error('Could not determine transfer amount from voucher');
    }

    const amount = Math.round(parsed.amount);
    logger.info('Voucher amount extracted', { amount });
    return amount;
  } catch (parseError) {
    logger.error('Failed to parse Claude response', {
      error: getErrorMessage(parseError),
      text: textBlock.text,
    });
    throw new Error('Failed to extract amount from voucher');
  }
}
