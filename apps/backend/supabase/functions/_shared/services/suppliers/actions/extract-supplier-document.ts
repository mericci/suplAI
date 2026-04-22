/**
 * Extract Supplier Document Action (Edge Function)
 *
 * Uses Deno.env for API key and fetch (native in Deno).
 */

import { logger } from '../../../utils/logger.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { ExtractedDocumentData } from '../../../types/supplier-document.ts';
import { callAnthropicMessages, anthropicModels } from '../../../commons/integrations/anthropic/index.ts';
import { extractSupplierDocumentPrompt } from '../prompts/index.ts';

export async function extractSupplierDocument(
  fileBytes: Uint8Array,
  mimeType: string,
  _fileName: string,
): Promise<ExtractedDocumentData> {
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

  logger.info('Calling Claude API for document extraction', { mimeType });

  const result = await callAnthropicMessages({
    model: anthropicModels.sonnet46,
    max_tokens: 1024,
    system: extractSupplierDocumentPrompt,
    messages: [
      {
        role: 'user',
        content: [
          contentBlock,
          {
            type: 'text',
            text: 'Extrae la información de este documento y devuélvela como JSON según el formato indicado.',
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
    const extracted = JSON.parse(jsonMatch[0]) as ExtractedDocumentData;
    logger.info('Document extraction successful');
    return extracted;
  } catch (parseError) {
    logger.error('Failed to parse Claude response', {
      error: getErrorMessage(parseError),
      text: textBlock.text,
    });
    throw new Error('Failed to parse document extraction response');
  }
}
