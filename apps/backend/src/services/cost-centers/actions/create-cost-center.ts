/**
 * Create Cost Center Action
 */

import * as costCenterDb from '../../../db/cost-center.db.js';
import { validateCreateCostCenter } from '../../../db/schemas/cost-center.schema.js';
import { getCostCenter } from './get-cost-center.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { CostCenterDetail } from '../types/index.js';

export async function createCostCenter(
  organizationId: string,
  rawData: unknown,
): Promise<CostCenterDetail> {
  try {
    const data = validateCreateCostCenter(rawData);

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
    // Unique index violation on (organization_id, external_id)
    if (msg.includes('23505') || msg.toLowerCase().includes('unique')) {
      throw new Error('Ya existe un centro de costos con ese ID en esta organización');
    }
    throw new Error(msg);
  }
}
