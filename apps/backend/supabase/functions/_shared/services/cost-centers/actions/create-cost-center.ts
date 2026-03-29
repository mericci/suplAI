/**
 * Create Cost Center Action (Edge Function)
 */

import { z } from 'zod';
import * as costCenterDb from '../../../db/cost-center.db.ts';
import { getCostCenter } from './get-cost-center.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { CostCenterDetail } from '../types/index.ts';

const CreateCostCenterSchema = z.object({
  externalId: z.string().min(1).max(100).trim(),
  name: z.string().min(1).max(200).trim(),
  userIds: z.array(z.string().uuid()).optional().default([]),
});

export async function createCostCenter(
  organizationId: string,
  rawData: unknown,
): Promise<CostCenterDetail> {
  try {
    const data = CreateCostCenterSchema.parse(rawData);

    const cc = await costCenterDb.create({
      organization_id: organizationId,
      external_id: data.externalId,
      name: data.name,
    });

    if (data.userIds && data.userIds.length > 0) {
      await costCenterDb.replaceCostCenterUsers(cc.id, data.userIds);
    }

    const detail = await getCostCenter(cc.id, organizationId);
    if (!detail) throw new Error('Cost center not found after creation');
    return detail;
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('23505') || msg.toLowerCase().includes('unique')) {
      throw new Error('Ya existe un centro de costos con ese ID en esta organización');
    }
    throw new Error(msg);
  }
}
