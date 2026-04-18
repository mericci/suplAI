import { logger } from '../../../utils/logger.js';
import * as rendicionDb from '../../../db/rendicion.db.js';
import * as rendicionDocDb from '../../../db/rendicion-document.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { RendicionPublic } from '../types/index.js';

export async function approveRendicion(
  id: string,
  organizationId: string,
  userId: string,
  aiValidated: boolean,
): Promise<RendicionPublic> {
  try {
    logger.info('Approving rendicion', { id, organizationId, userId, aiValidated });

    const rendicion = await rendicionDb.findByIdAndOrg(id, organizationId);
    if (!rendicion) throw new Error('Rendicion not found');
    if (rendicion.status !== 'pending') {
      throw new Error(`Cannot approve rendicion with status: ${rendicion.status}`);
    }

    const totalAmount = await rendicionDocDb.computeTotalAmount(id);

    const updated = await rendicionDb.update(id, {
      status: 'approved',
      ai_validated: aiValidated,
      total_amount: totalAmount,
      approved_by_user_id: userId,
      approved_at: new Date().toISOString(),
    });

    const documents = await rendicionDocDb.findAllByRendicion(id);
    return { ...updated, documents, document_count: documents.length };
  } catch (error) {
    logger.error('Error approving rendicion', { error: getErrorMessage(error) });
    throw error;
  }
}
