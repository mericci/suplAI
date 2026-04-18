import { logger } from '../../../utils/logger.ts';
import * as rendicionDb from '../../../db/rendicion.db.ts';
import * as rendicionDocDb from '../../../db/rendicion-document.db.ts';
import { uploadFile } from '../../../storage/service.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { UploadRendicionDocumentResult } from '../types/index.ts';

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const STORAGE_BUCKET = 'rendicion-evidence';

/* eslint-disable max-len */
const SYSTEM_PROMPT = `Eres un experto validador de documentos de respaldo para rendiciones de gastos en Chile.
Tu tarea es analizar documentos como boletas, facturas, tickets, comprobantes y determinar si son respaldos válidos.

Responde ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "isValid": true/false,
  "backingType": "boleta|factura|comprobante|ticket|otro|null",
  "serviceType": "descripción breve del servicio o producto, o null",
  "amount": número o null,
  "validationNotes": "razón breve de la validación o rechazo",
  "issuerRut": "RUT del emisor en formato XXXXXXXX-X, o null",
  "documentDate": "fecha del documento en formato YYYY-MM-DD, o null",
  "documentNumber": "número del documento, o null"
}

Criterios de validez:
- VÁLIDO: boleta, factura, ticket con monto, fecha y emisor identificables
- INVÁLIDO: fotos, imágenes sin datos financieros, documentos no relacionados con gastos, documentos ilegibles
- INVÁLIDO: documentos sin monto identificable

No incluyas texto adicional fuera del JSON.`;
/* eslint-enable max-len */

interface AiValidationResult {
  isValid: boolean;
  backingType: 'boleta' | 'factura' | 'comprobante' | 'ticket' | 'otro' | null;
  serviceType: string | null;
  amount: number | null;
  validationNotes: string;
  issuerRut: string | null;
  documentDate: string | null;
  documentNumber: string | null;
}

async function validateDocumentWithAI(
  fileBytes: Uint8Array,
  mimeType: string,
): Promise<AiValidationResult> {
  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured');

  const base64Data = btoa(String.fromCharCode(...fileBytes));

  let contentBlock: Record<string, unknown>;
  if (mimeType === 'application/pdf') {
    contentBlock = {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: base64Data },
    };
  } else {
    const validImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    const effectiveMime = validImageTypes.includes(mimeType) ? mimeType : 'image/jpeg';
    contentBlock = {
      type: 'image',
      source: { type: 'base64', media_type: effectiveMime, data: base64Data },
    };
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 512,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            contentBlock,
            { type: 'text', text: 'Analiza este documento y devuelve el JSON de validación.' },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Claude API error: ${response.status} ${err}`);
  }

  const result = await response.json() as { content: Array<{ type: string; text: string }> };
  const textBlock = result.content.find((b) => b.type === 'text');
  if (!textBlock) throw new Error('No text response from Claude API');

  const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Claude response');
  return JSON.parse(jsonMatch[0]) as AiValidationResult;
}

async function computeDocumentHash(
  amount: number | null,
  documentDate: string | null,
  documentNumber: string | null,
  issuerRut: string | null,
): Promise<string> {
  const key = `${amount ?? ''}:${documentDate ?? ''}:${documentNumber ?? ''}:${issuerRut ?? ''}`;
  const encoded = new TextEncoder().encode(key);
  const hashBuf = await crypto.subtle.digest('SHA-256', encoded);
  const hashArray = Array.from(new Uint8Array(hashBuf));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function uploadRendicionDocument(
  rendicionId: string,
  organizationId: string,
  file: File,
): Promise<UploadRendicionDocumentResult> {
  try {
    logger.info('Uploading rendicion document', { rendicionId, organizationId, name: file.name });

    const rendicion = await rendicionDb.findByIdAndOrg(rendicionId, organizationId);
    if (!rendicion) throw new Error('Rendicion not found');

    const mimeType = file.type || 'application/octet-stream';
    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(mimeType)) throw new Error(`Unsupported file type: ${mimeType}`);

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const storagePath = `${organizationId}/${rendicionId}/${Date.now()}-${file.name}`;

    const { path: uploadedPath } = await uploadFile({
      bucket: STORAGE_BUCKET,
      path: storagePath,
      file,
      contentType: mimeType,
    });

    let aiResult: AiValidationResult;
    try {
      aiResult = await validateDocumentWithAI(fileBytes, mimeType);
    } catch (aiError) {
      logger.error('AI validation failed', { error: getErrorMessage(aiError) });
      aiResult = {
        isValid: false, backingType: null, serviceType: null, amount: null,
        validationNotes: 'AI validation unavailable',
        issuerRut: null, documentDate: null, documentNumber: null,
      };
    }

    const hash = await computeDocumentHash(
      aiResult.amount, aiResult.documentDate, aiResult.documentNumber, aiResult.issuerRut,
    );
    const isDuplicate = aiResult.amount !== null
      ? await rendicionDocDb.checkDuplicate(organizationId, hash)
      : false;

    const document = await rendicionDocDb.create({
      rendicion_id: rendicionId,
      organization_id: organizationId,
      file_name: file.name,
      storage_path: uploadedPath,
      storage_bucket: STORAGE_BUCKET,
      backing_type: aiResult.backingType,
      service_type: aiResult.serviceType,
      amount: aiResult.amount,
      ai_validation_status: aiResult.isValid ? 'valid' : 'invalid',
      ai_validation_notes: `hash:${hash} | ${aiResult.validationNotes}`,
      is_duplicate: isDuplicate,
      is_pending_distribution: true,
    });

    const totalAmount = await rendicionDocDb.computeTotalAmount(rendicionId);
    await rendicionDb.update(rendicionId, { total_amount: totalAmount });

    return { document, totalAmount };
  } catch (error) {
    logger.error('Error uploading rendicion document', { error: getErrorMessage(error) });
    throw error;
  }
}
