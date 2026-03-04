/**
 * Extract Supplier Document Action
 *
 * Accepts a file (PDF or image), sends it to Claude API,
 * and returns structured supplier/service data extracted from the document.
 */

import type { ExtractedDocumentData } from '@supl/shared';
import { logger } from '../../../utils/logger.js';
import { getErrorMessage } from '../../../utils/error.js';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';

/* eslint-disable max-len */
const SYSTEM_PROMPT = `Eres un experto analizador de documentos comerciales chilenos.
Tu tarea es extraer información estructurada de documentos como boletas, contratos, cotizaciones o facturas.

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "supplierName": "nombre legal del proveedor o null",
  "supplierRut": "RUT del proveedor en formato XX.XXX.XXX-X o XXXXXXXX-X, o null",
  "documentType": "tipo de documento (ej: Boleta Exenta, Contrato, Cotización, Factura) o null",
  "serviceDescription": "descripción del servicio o producto, o null",
  "serviceCategory": "categoría del servicio (ej: Consultoría, Arriendo, Software, Marketing, Otro) o null",
  "tariffType": "tipo de tarifa (ej: Fijo en CLP, Variable por hora, Por proyecto) o null",
  "tariffDetail": "detalle adicional de la tarifa o condiciones, o null",
  "amounts": [
    {
      "amount": 0,
      "currency": "CLP",
      "concept": "descripción del monto",
      "frequency": "frecuencia (ej: Mensual, Por hora, Único, Anual)"
    }
  ]
}

Si no puedes determinar un valor, usa null. Para amounts, usa un array vacío [] si no hay montos identificables.
No incluyas texto adicional fuera del JSON.`;
/* eslint-enable max-len */

export async function extractSupplierDocument(
  fileBytes: Uint8Array,
  mimeType: string,
  _fileName: string,
): Promise<ExtractedDocumentData> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }

  const base64Data = Buffer.from(fileBytes).toString('base64');

  // Build content block based on file type
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
    throw new Error(
      `Unsupported file type: ${mimeType}. Supported types: PDF, JPEG, PNG, GIF, WebP`,
    );
  }

  logger.info('Calling Claude API for document extraction', { mimeType });

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
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
    // Extract JSON from the response (handle potential markdown code blocks)
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
