import { logger } from '../../../utils/logger.ts';
import * as rendicionDb from '../../../db/rendicion.db.ts';
import * as rendicionDocDb from '../../../db/rendicion-document.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { RendicionPublic } from '../types/index.ts';

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
