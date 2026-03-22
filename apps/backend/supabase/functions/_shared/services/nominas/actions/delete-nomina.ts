/**
 * Delete Nomina Action (Edge Function)
 */

import { logger } from '../../../utils/logger.ts';
import * as nominaDb from '../../../db/nomina.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';

export async function deleteNomina(id: string, orgId: string): Promise<void> {
  try {
    logger.info('Deleting nomina', { nominaId: id, orgId });

    const nomina = await nominaDb.findById(id, orgId);
    if (!nomina) throw new Error('Nomina not found');

    await nominaDb.softDelete(id, orgId);

    logger.info('Nomina deleted', { nominaId: id });
  } catch (error) {
    logger.error('Error deleting nomina', { error: getErrorMessage(error) });
    throw error;
  }
}
