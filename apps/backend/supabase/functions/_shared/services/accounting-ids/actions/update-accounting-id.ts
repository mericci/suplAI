/**
 * Update Accounting ID Action (Edge Function)
 */

import { z } from 'zod';
import * as accountingIdDb from '../../../db/accounting-id.db.ts';
import { getAccountingId } from './get-accounting-id.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { AccountingIdWithAggregates } from '../types/index.ts';

const UpdateAccountingIdSchema = z.object({
  externalId: z.string().min(1).max(100).trim().optional(),
  description: z.string().min(1).max(500).trim().optional(),
});

export async function updateAccountingId(
  id: string,
  organizationId: string,
  rawData: unknown,
): Promise<AccountingIdWithAggregates | null> {
  try {
    const data = UpdateAccountingIdSchema.parse(rawData);

    const existing = await accountingIdDb.findById(id, organizationId);
    if (!existing) return null;

    const updatePayload: { external_id?: string; description?: string } = {};
    if (data.externalId !== undefined) updatePayload.external_id = data.externalId;
    if (data.description !== undefined) updatePayload.description = data.description;

    if (Object.keys(updatePayload).length > 0) {
      await accountingIdDb.update(id, organizationId, updatePayload);
    }

    return getAccountingId(id, organizationId);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('23505') || msg.toLowerCase().includes('unique')) {
      throw new Error('Ya existe un ID contable con ese ID en esta organización');
    }
    throw new Error(msg);
  }
}
