/**
 * Create Accounting ID Action
 */

import * as accountingIdDb from '../../../db/accounting-id.db.js';
import { validateCreateAccountingId } from '../../../db/schemas/accounting-id.schema.js';
import { getAccountingId } from './get-accounting-id.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { AccountingIdWithAggregates } from '../types/index.js';

export async function createAccountingId(
  organizationId: string,
  rawData: unknown,
): Promise<AccountingIdWithAggregates> {
  try {
    const data = validateCreateAccountingId(rawData);

    const item = await accountingIdDb.create({
      organization_id: organizationId,
      external_id: data.externalId,
      description: data.description,
    });

    const detail = await getAccountingId(item.id, organizationId);
    if (!detail) throw new Error('Accounting ID not found after creation');
    return detail;
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('23505') || msg.toLowerCase().includes('unique')) {
      throw new Error('Ya existe un ID contable con ese ID en esta organización');
    }
    throw new Error(msg);
  }
}
