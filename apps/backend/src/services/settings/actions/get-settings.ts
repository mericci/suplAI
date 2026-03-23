/**
 * Get Settings Action
 *
 * Returns all organization rules for a given org and optional supplier scope.
 */

import type { OrganizationRule } from '@supl/shared';
import * as ruleDb from '../../../db/organization-rule.db.js';
import { toPublicRule } from '../types/index.js';

export async function getSettings(
  orgId: string,
  supplierId?: string,
): Promise<OrganizationRule[]> {
  const rows = supplierId != null
    ? await ruleDb.findByOrgAndSupplier(orgId, supplierId)
    : await ruleDb.findAllByOrg(orgId);

  return rows.map(toPublicRule);
}
