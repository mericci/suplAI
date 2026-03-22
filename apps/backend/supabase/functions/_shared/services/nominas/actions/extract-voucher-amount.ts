/**
 * Extract Voucher Amount Action (Edge Function)
 *
 * Uses Deno.env for API key and fetch (native in Deno).
 */

import { logger } from '../../../utils/logger.ts';
import { getErrorMessage } from '../../../utils/error.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

const SYSTEM_PROMPT = `Eres un experto en análisis de comprobantes de transferencia bancaria chilenos.
Tu tarea es extraer el monto total transferido en CLP (pesos chilenos) del comprobante de pago.

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "amount": <entero en pesos chilenos>
}

El campo "amount" debe ser un número entero que represente el monto total en CLP (sin decimales, sin símbolos).
Si no puedes determinar el monto con certeza, responde con { "amount": null }.
No incluyas texto adicional fuera del JSON.`;

export async function extractVoucherAmount(
  fileBytes: Uint8Array,
  mimeType: string,
): Promise<number> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  // Convert Uint8Array to base64 in Deno (chunked to avoid stack overflow on large files)
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

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 256,
      system: SYSTEM_PROMPT,
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
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    logger.error('Claude API error', { status: response.status, body: errorText });
    throw new Error(`Claude API error: ${response.status} ${errorText}`);
  }

  const result = await response.json() as {
    content: Array<{ type: string; text: string }>;
  };

  const textBlock = result.content.find((b) => b.type === 'text');
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
