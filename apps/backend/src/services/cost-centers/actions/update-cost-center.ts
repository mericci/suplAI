/**
 * Update Cost Center Action
 */

import * as costCenterDb from '../../../db/cost-center.db.js';
import { validateUpdateCostCenter } from '../../../db/schemas/cost-center.schema.js';
import { getCostCenter } from './get-cost-center.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { CostCenterDetail } from '../types/index.js';

export async function updateCostCenter(
  id: string,
  organizationId: string,
  rawData: unknown,
): Promise<CostCenterDetail | null> {
  try {
    const data = validateUpdateCostCenter(rawData);

    const existing = await costCenterDb.findById(id, organizationId);
    if (!existing) return null;

    const updatePayload: { external_id?: string; name?: string } = {};
    if (data.externalId !== undefined) updatePayload.external_id = data.externalId;
    if (data.name !== undefined) updatePayload.name = data.name;

    if (Object.keys(updatePayload).length > 0) {
      await costCenterDb.update(id, organizationId, updatePayload);
    }

    if (data.userIds !== undefined) {
      await costCenterDb.replaceCostCenterUsers(id, data.userIds);
    }

    return getCostCenter(id, organizationId);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('23505') || msg.toLowerCase().includes('unique')) {
      throw new Error('Ya existe un centro de costos con ese ID en esta organización');
    }
    throw new Error(msg);
  }
}
