import * as ruleDb from '../../../db/organization-rule.db.ts';
import { toPublicRule } from '../types/index.ts';
import type { OrganizationRule } from '@supl/shared';

export async function getSettings(
  orgId: string,
  supplierId?: string,
): Promise<OrganizationRule[]> {
  const rows = supplierId != null
    ? await ruleDb.findByOrgAndSupplier(orgId, supplierId)
    : await ruleDb.findAllByOrg(orgId);

  return rows.map(toPublicRule);
}
