/**
 * Organization Rule Database Queries (Edge Function)
 */

import { supabase } from '../lib/supabase.ts';

export interface OrgRuleRow {
  id: string;
  org_id: string;
  supplier_id: string | null;
  min_amount: number;
  max_amount: number | null;
  ai_tolerance_pct: number;
  ai_max_amount: number | null;
  notify_sii_on_approve: boolean;
  notify_sii_on_reject: boolean;
  merito_action: string;
  merito_days_before: number | null;
  merito_alert_enabled: boolean;
  merito_alert_days_before: number | null;
  merito_alert_emails: string[] | null;
  merito_completed_action: string;
  ai_approve_action: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export async function findAllByOrg(orgId: string): Promise<OrgRuleRow[]> {
  const { data, error } = await supabase
    .from('organization_rules')
    .select('*')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('supplier_id', { ascending: true, nullsFirst: true })
    .order('min_amount', { ascending: true });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as OrgRuleRow[];
}

export async function findByOrgAndSupplier(
  orgId: string,
  supplierId: string | null,
): Promise<OrgRuleRow[]> {
  let query = supabase
    .from('organization_rules')
    .select('*')
    .eq('org_id', orgId)
    .is('deleted_at', null)
    .order('min_amount', { ascending: true });

  if (supplierId) {
    query = query.eq('supplier_id', supplierId);
  } else {
    query = query.is('supplier_id', null);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as OrgRuleRow[];
}

export async function findApplicableRule(
  orgId: string,
  supplierId: string,
  amount: number,
): Promise<OrgRuleRow | null> {
  // Try supplier-specific first
  const { data: supplierRules, error: supplierError } = await supabase
    .from('organization_rules')
    .select('*')
    .eq('org_id', orgId)
    .eq('supplier_id', supplierId)
    .is('deleted_at', null)
    .lte('min_amount', amount)
    .order('min_amount', { ascending: false });

  if (supplierError) throw new Error(`Database error: ${supplierError.message}`);

  const matchingSupplierRules = ((supplierRules ?? []) as OrgRuleRow[]).filter(
    (r) => r.max_amount == null || amount <= r.max_amount,
  );

  if (matchingSupplierRules.length > 0) return matchingSupplierRules[0];

  // Fallback: global rules
  const { data: globalRules, error: globalError } = await supabase
    .from('organization_rules')
    .select('*')
    .eq('org_id', orgId)
    .is('supplier_id', null)
    .is('deleted_at', null)
    .lte('min_amount', amount)
    .order('min_amount', { ascending: false });

  if (globalError) throw new Error(`Database error: ${globalError.message}`);

  const matchingGlobalRules = ((globalRules ?? []) as OrgRuleRow[]).filter(
    (r) => r.max_amount == null || amount <= r.max_amount,
  );

  return matchingGlobalRules[0] ?? null;
}

export async function replaceRules(
  orgId: string,
  supplierId: string | null,
  rules: Array<{
    minAmount: number;
    maxAmount?: number | null;
    aiTolerancePct: number;
    aiMaxAmount?: number | null;
    notifySiiOnApprove: boolean;
    notifySiiOnReject: boolean;
    meritoAction: string;
    meritoDaysBefore?: number | null;
    meritoAlertEnabled: boolean;
    meritoAlertDaysBefore?: number | null;
    meritoAlertEmails?: string[] | null;
    meritoCompletedAction: string;
    aiApproveAction: string;
  }>,
): Promise<OrgRuleRow[]> {
  let deleteQuery = supabase
    .from('organization_rules')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('org_id', orgId)
    .is('deleted_at', null);

  if (supplierId) {
    deleteQuery = deleteQuery.eq('supplier_id', supplierId);
  } else {
    deleteQuery = deleteQuery.is('supplier_id', null);
  }

  const { error: deleteError } = await deleteQuery;
  if (deleteError) throw new Error(`Database error: ${deleteError.message}`);

  if (rules.length === 0) return [];

  const inserts = rules.map((r) => ({
    org_id: orgId,
    supplier_id: supplierId ?? null,
    min_amount: r.minAmount,
    max_amount: r.maxAmount ?? null,
    ai_tolerance_pct: r.aiTolerancePct,
    ai_max_amount: r.aiMaxAmount ?? null,
    notify_sii_on_approve: r.notifySiiOnApprove,
    notify_sii_on_reject: r.notifySiiOnReject,
    merito_action: r.meritoAction,
    merito_days_before: r.meritoDaysBefore ?? null,
    merito_alert_enabled: r.meritoAlertEnabled,
    merito_alert_days_before: r.meritoAlertDaysBefore ?? null,
    merito_alert_emails: r.meritoAlertEmails ?? null,
    merito_completed_action: r.meritoCompletedAction,
    ai_approve_action: r.aiApproveAction,
  }));

  const { data, error: insertError } = await supabase
    .from('organization_rules')
    .insert(inserts as never)
    .select();

  if (insertError) throw new Error(`Database error: ${insertError.message}`);
  return (data ?? []) as OrgRuleRow[];
}
