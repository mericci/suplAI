/**
 * Upsert Settings Action
 *
 * Replaces all rules for a given org + supplier scope (or global).
 */

import type { OrganizationRule, UpsertOrganizationRulePayload } from '@supl/shared';
import * as ruleDb from '../../../db/organization-rule.db.js';
import { toPublicRule } from '../types/index.js';

export async function upsertSettings(
  orgId: string,
  rules: UpsertOrganizationRulePayload[],
  supplierId?: string,
): Promise<OrganizationRule[]> {
  const rows = await ruleDb.replaceRules(
    orgId,
    supplierId ?? null,
    rules.map((r) => ({
      minAmount: r.minAmount,
      maxAmount: r.maxAmount,
      aiTolerancePct: r.aiTolerancePct,
      aiMaxAmount: r.aiMaxAmount,
      notifySiiOnApprove: r.notifySiiOnApprove,
      notifySiiOnReject: r.notifySiiOnReject,
      meritoAction: r.meritoAction,
      meritoDaysBefore: r.meritoDaysBefore,
      meritoAlertEnabled: r.meritoAlertEnabled,
      meritoAlertDaysBefore: r.meritoAlertDaysBefore,
      meritoAlertEmails: r.meritoAlertEmails,
      meritoCompletedAction: r.meritoCompletedAction,
      aiApproveAction: r.aiApproveAction,
    })),
  );

  return rows.map(toPublicRule);
}
