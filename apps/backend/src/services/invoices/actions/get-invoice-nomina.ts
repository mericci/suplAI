/**
 * Get Invoice Nomina Action
 *
 * Returns the nomina this invoice belongs to, if any.
 */

import { logger } from '../../../utils/logger.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import * as nominaDb from '../../../db/nomina.db.js';
import type { NominaRow } from '../../../db/nomina.db.js';
import { getErrorMessage } from '../../../utils/error.js';

export async function getInvoiceNomina(
  id: string,
  organizationId: string,
): Promise<NominaRow | null> {
  try {
    const existing = await invoiceDb.findById(id, organizationId);
    if (!existing) throw new Error('Invoice not found');

    return nominaDb.findNominaByInvoiceId(id, organizationId);
  } catch (error) {
    logger.error('Error getting invoice nomina', { error: getErrorMessage(error) });
    throw error;
  }
}
