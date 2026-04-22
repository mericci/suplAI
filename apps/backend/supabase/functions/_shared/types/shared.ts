export type MeritoAction = 'nothing' | 'reject_sii_and_supl' | 'reject_supl_only';
export type MeritoCompletedAction = 'nothing' | 'wait_manual' | 'auto_approve';
export type AiApproveAction = 'nothing' | 'mark_approved';

export interface OrganizationRule {
  id: string;
  orgId: string;
  supplierId?: string | null;
  minAmount: number;
  maxAmount?: number | null;
  aiTolerancePct: number;
  aiMaxAmount?: number | null;
  notifySiiOnApprove: boolean;
  notifySiiOnReject: boolean;
  meritoAction: MeritoAction;
  meritoDaysBefore?: number | null;
  meritoAlertEnabled: boolean;
  meritoAlertDaysBefore?: number | null;
  meritoAlertEmails?: string[] | null;
  meritoCompletedAction: MeritoCompletedAction;
  aiApproveAction: AiApproveAction;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertOrganizationRulePayload {
  supplierId?: string | null;
  minAmount: number;
  maxAmount?: number | null;
  aiTolerancePct: number;
  aiMaxAmount?: number | null;
  notifySiiOnApprove: boolean;
  notifySiiOnReject: boolean;
  meritoAction: MeritoAction;
  meritoDaysBefore?: number | null;
  meritoAlertEnabled: boolean;
  meritoAlertDaysBefore?: number | null;
  meritoAlertEmails?: string[] | null;
  meritoCompletedAction: MeritoCompletedAction;
  aiApproveAction: AiApproveAction;
}
