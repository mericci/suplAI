/**
 * Create Accounting ID Action (Edge Function)
 */

import { z } from 'zod';
import * as accountingIdDb from '../../../db/accounting-id.db.ts';
import { getAccountingId } from './get-accounting-id.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { AccountingIdWithAggregates } from '../types/index.ts';

const CreateAccountingIdSchema = z.object({
  externalId: z.string().min(1).max(100).trim(),
  description: z.string().min(1).max(500).trim(),
});

export async function createAccountingId(
  organizationId: string,
  rawData: unknown,
): Promise<AccountingIdWithAggregates> {
  try {
    const data = CreateAccountingIdSchema.parse(rawData);

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
