import { logger } from '../../../utils/logger.ts';
import * as rendicionDb from '../../../db/rendicion.db.ts';
import * as rendicionDocDb from '../../../db/rendicion-document.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { RendicionPublic } from '../types/index.ts';

export interface ListRendicionesParams {
  organizationId: string;
  userId?: string;
  viewAll?: boolean;
  status?: string;
  limit: number;
  offset: number;
}

export async function listRendiciones(
  params: ListRendicionesParams,
): Promise<{ rendiciones: RendicionPublic[]; total: number }> {
  try {
    logger.info('Listing rendiciones', params);
    const filters: rendicionDb.ListRendicionesFilters = {
      organizationId: params.organizationId,
      limit: params.limit,
      offset: params.offset,
      status: params.status,
    };
    if (!params.viewAll && params.userId) filters.userId = params.userId;

    const { rendiciones, total } = await rendicionDb.findAll(filters);
    const enriched = await Promise.all(
      rendiciones.map(async (r) => {
        const docs = await rendicionDocDb.findAllByRendicion(r.id);
        return { ...r, documents: docs, document_count: docs.length };
      }),
    );
    return { rendiciones: enriched, total };
  } catch (error) {
    logger.error('Error listing rendiciones', { error: getErrorMessage(error) });
    throw error;
  }
}
