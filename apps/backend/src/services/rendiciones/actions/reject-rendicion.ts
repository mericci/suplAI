import { logger } from '../../../utils/logger.js';
import * as rendicionDb from '../../../db/rendicion.db.js';
import * as rendicionDocDb from '../../../db/rendicion-document.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { validateRejectRendicion } from '../../../db/schemas/rendicion.schema.js';
import type { RendicionPublic } from '../types/index.js';

export async function rejectRendicion(
  id: string,
  organizationId: string,
  data: unknown,
): Promise<RendicionPublic> {
  try {
    logger.info('Rejecting rendicion', { id, organizationId });

    const rendicion = await rendicionDb.findByIdAndOrg(id, organizationId);
    if (!rendicion) throw new Error('Rendicion not found');
    if (!['draft', 'pending'].includes(rendicion.status)) {
      throw new Error(`Cannot reject rendicion with status: ${rendicion.status}`);
    }

    const validated = validateRejectRendicion(data);

    if (validated.documentCorrections?.length) {
      await Promise.all(
        validated.documentCorrections.map((correction) =>
          rendicionDocDb.update(correction.documentId, {
            corrected_amount: correction.correctedAmount,
          }),
        ),
      );
    }

    const totalAmount = await rendicionDocDb.computeTotalAmount(id);

    const updated = await rendicionDb.update(id, {
      status: 'rejected',
      rejection_notes: validated.rejectionNotes,
      total_amount: totalAmount,
    });

    const documents = await rendicionDocDb.findAllByRendicion(id);
    return { ...updated, documents, document_count: documents.length };
  } catch (error) {
    logger.error('Error rejecting rendicion', { error: getErrorMessage(error) });
    throw error;
  }
}
