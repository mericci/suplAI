import * as ruleDb from '../../../db/organization-rule.db.ts';
import { toPublicRule } from '../types/index.ts';
import type { OrganizationRule, UpsertOrganizationRulePayload } from '../../../types/shared.ts';

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
