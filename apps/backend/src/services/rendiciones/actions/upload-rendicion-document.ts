import { logger } from '../../../utils/logger.js';
import * as rendicionDb from '../../../db/rendicion.db.js';
import * as rendicionDocDb from '../../../db/rendicion-document.db.js';
import { uploadFile } from '../../../storage/service.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { UploadRendicionDocumentResult } from '../types/index.js';
import { callAnthropicMessages, anthropicModels } from '../../../commons/integrations/anthropic/index.js';
import { validateRendicionDocumentPrompt } from '../prompts/index.js';

const STORAGE_BUCKET = 'rendicion-evidence';

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
  const base64Data = Buffer.from(fileBytes).toString('base64');

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

  const result = await callAnthropicMessages({
    model: anthropicModels.sonnet46,
    max_tokens: 512,
    system: validateRendicionDocumentPrompt,
    messages: [
      {
        role: 'user',
        content: [
          contentBlock,
          { type: 'text', text: 'Analiza este documento y devuelve el JSON de validación.' },
        ],
      },
    ],
  });

  const textBlock = result.content.find((b) => b.type === 'text') as { type: string; text: string } | undefined;
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
    if (!supportedTypes.includes(mimeType)) {
      throw new Error(`Unsupported file type: ${mimeType}`);
    }

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
      logger.error('AI validation failed, marking as pending', { error: getErrorMessage(aiError) });
      aiResult = {
        isValid: false,
        backingType: null,
        serviceType: null,
        amount: null,
        validationNotes: 'AI validation unavailable',
        issuerRut: null,
        documentDate: null,
        documentNumber: null,
      };
    }

    const hash = await computeDocumentHash(
      aiResult.amount,
      aiResult.documentDate,
      aiResult.documentNumber,
      aiResult.issuerRut,
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
