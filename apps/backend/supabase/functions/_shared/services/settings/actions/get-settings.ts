import * as ruleDb from '../../../db/organization-rule.db.ts';
import { toPublicRule } from '../types/index.ts';
import type { OrganizationRule } from '../../../types/shared.ts';

export async function getSettings(
  orgId: string,
  supplierId?: string,
): Promise<OrganizationRule[]> {
  const rows = supplierId != null
    ? await ruleDb.findByOrgAndSupplier(orgId, supplierId)
    : await ruleDb.findAllByOrg(orgId);

  return rows.map(toPublicRule);
}
