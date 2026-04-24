import { logger } from '../../../utils/logger.ts';
import * as rendicionDb from '../../../db/rendicion.db.ts';
import * as rendicionDocDb from '../../../db/rendicion-document.db.ts';
import * as costCenterDb from '../../../db/cost-center.db.ts';
import * as accountingIdDb from '../../../db/accounting-id.db.ts';
import * as budgetItemDb from '../../../db/budget-item.db.ts';
import { uploadFile } from '../../../storage/service.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { UploadRendicionDocumentResult } from '../types/index.ts';
import { callAnthropicMessages, anthropicModels } from '../../../commons/integrations/anthropic/index.ts';
import { validateRendicionDocumentPrompt } from '../prompts/index.ts';
import type { AccountingIdRow } from '../../../db/accounting-id.db.ts';

const STORAGE_BUCKET = 'rendicion-evidence';

function detectMimeType(bytes: Uint8Array): string {
  if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) return 'application/pdf';
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46) return 'image/gif';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46
    && bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
  return 'application/octet-stream';
}

interface AiValidationResult {
  isValid: boolean;
  backingType: 'boleta' | 'factura' | 'comprobante' | 'ticket' | 'otro' | null;
  serviceType: string | null;
  amount: number | null;
  validationNotes: string;
  issuerRut: string | null;
  documentDate: string | null;
  documentNumber: string | null;
  accountingId: string | null;
}

function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

async function validateDocumentWithAI(
  fileBytes: Uint8Array,
  mimeType: string,
  accountingIds: AccountingIdRow[],
): Promise<AiValidationResult> {
  const base64Data = uint8ArrayToBase64(fileBytes);

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
    system: validateRendicionDocumentPrompt(accountingIds),
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

function getBudgetPeriodWindow(periodicity: string): { start: string; end: string } {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (periodicity === 'quarterly') {
    const quarter = Math.floor(now.getMonth() / 3);
    start = new Date(now.getFullYear(), quarter * 3, 1);
    end = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59, 999);
  } else if (periodicity === 'annual') {
    start = new Date(now.getFullYear(), 0, 1);
    end = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { start: start.toISOString(), end: end.toISOString() };
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

    const [userCostCenterIds, accountingIds] = await Promise.all([
      costCenterDb.findCostCenterIdsByUser(rendicion.created_by_user_id),
      accountingIdDb.findAllByOrganization(organizationId),
    ]);
    const autoCostCenterId = userCostCenterIds.length === 1 ? userCostCenterIds[0] : null;

    const fileBytes = new Uint8Array(await file.arrayBuffer());
    const mimeType = detectMimeType(fileBytes);
    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(mimeType)) throw new Error(`Unsupported file type: ${mimeType}`);

    const storagePath = `${organizationId}/${rendicionId}/${Date.now()}-${file.name}`;

    const { path: uploadedPath } = await uploadFile({
      bucket: STORAGE_BUCKET,
      path: storagePath,
      file,
      contentType: mimeType,
    });

    let aiResult: AiValidationResult;
    try {
      aiResult = await validateDocumentWithAI(fileBytes, mimeType, accountingIds);
    } catch (aiError) {
      const errMsg = getErrorMessage(aiError);
      logger.error('AI validation failed', { error: errMsg });
      aiResult = {
        isValid: false, backingType: null, serviceType: null, amount: null,
        validationNotes: 'AI validation unavailable',
        issuerRut: null, documentDate: null, documentNumber: null, accountingId: null,
      };
    }

    // Resolve accounting ID: AI match → fallback "otros gastos" → null
    let resolvedAccountingId: string | null = null;
    if (aiResult.accountingId) {
      const match = accountingIds.find((a) => a.id === aiResult.accountingId);
      if (match) resolvedAccountingId = match.id;
    }
    if (!resolvedAccountingId) {
      const otrosGastos = accountingIds.find((a) =>
        a.description.toLowerCase().includes('otros') || a.external_id.toLowerCase().includes('otros'),
      );
      if (otrosGastos) resolvedAccountingId = otrosGastos.id;
    }

    const isPendingDistribution = resolvedAccountingId === null || autoCostCenterId === null;

    // Budget validation
    let validationStatus = aiResult.isValid ? 'valid' : 'invalid';
    let validationNotes = aiResult.validationNotes;

    if (aiResult.isValid && resolvedAccountingId && aiResult.amount !== null) {
      const budget = await budgetItemDb.findBudgetForAccountingId(organizationId, resolvedAccountingId);
      if (budget) {
        const { start, end } = getBudgetPeriodWindow(budget.periodicity);
        const currentSpend = await budgetItemDb.computeSpendForAccountingId(
          organizationId, resolvedAccountingId, start, end,
        );
        if (currentSpend + aiResult.amount > budget.amount) {
          validationStatus = 'invalid';
          validationNotes = `Presupuesto excedido: gasto acumulado $${currentSpend.toLocaleString('es-CL')} + $${aiResult.amount.toLocaleString('es-CL')} supera el límite de $${budget.amount.toLocaleString('es-CL')}`;
        }
      }
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
      ai_validation_status: validationStatus,
      document_hash: hash,
      ai_validation_notes: validationNotes,
      is_duplicate: isDuplicate,
      cost_center_id: autoCostCenterId ?? undefined,
      accounting_id: resolvedAccountingId ?? undefined,
      is_pending_distribution: isPendingDistribution,
    });

    const totalAmount = await rendicionDocDb.computeTotalAmount(rendicionId);
    await rendicionDb.update(rendicionId, { total_amount: totalAmount });

    return { document, totalAmount };
  } catch (error) {
    logger.error('Error uploading rendicion document', { error: getErrorMessage(error) });
    throw error;
  }
}
