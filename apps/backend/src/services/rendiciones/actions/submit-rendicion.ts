import { logger } from '../../../utils/logger.js';
import * as rendicionDb from '../../../db/rendicion.db.js';
import * as rendicionDocDb from '../../../db/rendicion-document.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { z } from 'zod';
import type { RendicionPublic } from '../types/index.js';

const SubmitRendicionSchema = z.object({
  submissionNotes: z.string().min(1, 'La justificación es obligatoria.'),
});

export async function submitRendicion(
  id: string,
  organizationId: string,
  data: unknown,
): Promise<RendicionPublic> {
  try {
    logger.info('Submitting rendicion for review', { id, organizationId });

    const rendicion = await rendicionDb.findByIdAndOrg(id, organizationId);
    if (!rendicion) throw new Error('Rendicion not found');
    if (!['draft', 'pending'].includes(rendicion.status)) {
      throw new Error(`Cannot submit rendicion with status: ${rendicion.status}`);
    }

    const { submissionNotes } = SubmitRendicionSchema.parse(data);
    const totalAmount = await rendicionDocDb.computeTotalAmount(id);

    const updated = await rendicionDb.update(id, {
      status: 'pending',
      submission_notes: submissionNotes,
      total_amount: totalAmount,
    });

    const documents = await rendicionDocDb.findAllByRendicion(id);
    return { ...updated, documents, document_count: documents.length };
  } catch (error) {
    logger.error('Error submitting rendicion', { error: getErrorMessage(error) });
    throw error;
  }
}
