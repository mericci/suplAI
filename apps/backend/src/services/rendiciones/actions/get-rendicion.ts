import { logger } from '../../../utils/logger.js';
import * as rendicionDb from '../../../db/rendicion.db.js';
import * as rendicionDocDb from '../../../db/rendicion-document.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { RendicionPublic } from '../types/index.js';

export async function getRendicion(
  id: string,
  organizationId: string,
): Promise<RendicionPublic> {
  try {
    logger.info('Getting rendicion', { id, organizationId });
    const rendicion = await rendicionDb.findByIdAndOrg(id, organizationId);
    if (!rendicion) throw new Error('Rendicion not found');

    const documents = await rendicionDocDb.findAllByRendicion(id);
    return { ...rendicion, documents, document_count: documents.length };
  } catch (error) {
    logger.error('Error getting rendicion', { error: getErrorMessage(error) });
    throw error;
  }
}
