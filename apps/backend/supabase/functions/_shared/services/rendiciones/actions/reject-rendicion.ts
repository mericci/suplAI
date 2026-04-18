import { logger } from '../../../utils/logger.ts';
import * as rendicionDb from '../../../db/rendicion.db.ts';
import * as rendicionDocDb from '../../../db/rendicion-document.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { validateRejectRendicion } from '../../../db/schemas/rendicion.schema.ts';
import type { RendicionPublic } from '../types/index.ts';

export async function rejectRendicion(
  id: string,
  organizationId: string,
  data: unknown,
): Promise<RendicionPublic> {
  try {
    logger.info('Rejecting rendicion', { id, organizationId });
    const rendicion = await rendicionDb.findByIdAndOrg(id, organizationId);
    if (!rendicion) throw new Error('Rendicion not found');
    if (rendicion.status !== 'pending') {
      throw new Error(`Cannot reject rendicion with status: ${rendicion.status}`);
    }
    const validated = validateRejectRendicion(data);
    if (validated.documentCorrections?.length) {
      await Promise.all(
        validated.documentCorrections.map((c) =>
          rendicionDocDb.update(c.documentId, { corrected_amount: c.correctedAmount }),
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
