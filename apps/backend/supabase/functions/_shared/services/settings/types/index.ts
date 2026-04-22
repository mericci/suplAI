import type { OrgRuleRow } from '../../../db/organization-rule.db.ts';
import type { OrganizationRule } from '../../../types/shared.ts';

export function toPublicRule(row: OrgRuleRow): OrganizationRule {
  return {
    id: row.id,
    orgId: row.org_id,
    supplierId: row.supplier_id,
    minAmount: Number(row.min_amount),
    maxAmount: row.max_amount != null ? Number(row.max_amount) : null,
    aiTolerancePct: row.ai_tolerance_pct,
    aiMaxAmount: row.ai_max_amount != null ? Number(row.ai_max_amount) : null,
    notifySiiOnApprove: row.notify_sii_on_approve,
    notifySiiOnReject: row.notify_sii_on_reject,
    meritoAction: row.merito_action as OrganizationRule['meritoAction'],
    meritoDaysBefore: row.merito_days_before,
    meritoAlertEnabled: row.merito_alert_enabled,
    meritoAlertDaysBefore: row.merito_alert_days_before,
    meritoAlertEmails: row.merito_alert_emails,
    meritoCompletedAction: row.merito_completed_action as OrganizationRule['meritoCompletedAction'],
    aiApproveAction: row.ai_approve_action as OrganizationRule['aiApproveAction'],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
