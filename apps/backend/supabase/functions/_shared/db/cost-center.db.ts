/**
 * Cost Center Database Queries (Edge Function)
 */

import { supabase } from '../lib/supabase.ts';

export interface CostCenterRow {
  id: string;
  organization_id: string;
  external_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CreateCostCenterData {
  organization_id: string;
  external_id: string;
  name: string;
}

export interface UpdateCostCenterData {
  external_id?: string;
  name?: string;
}

export async function findAllByOrganization(
  organizationId: string,
): Promise<CostCenterRow[]> {
  const { data, error } = await supabase
    .from('cost_centers' as never)
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Database error: ${error.message}`);
  return (data ?? []) as CostCenterRow[];
}

export async function findById(
  id: string,
  organizationId: string,
): Promise<CostCenterRow | null> {
  const { data, error } = await supabase
    .from('cost_centers' as never)
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data as CostCenterRow;
}

export async function create(data: CreateCostCenterData): Promise<CostCenterRow> {
  const { data: row, error } = await supabase
    .from('cost_centers' as never)
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return row as CostCenterRow;
}

export async function update(
  id: string,
  organizationId: string,
  data: UpdateCostCenterData,
): Promise<CostCenterRow> {
  const { data: row, error } = await supabase
    .from('cost_centers' as never)
    .update({ ...data, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return row as CostCenterRow;
}

export async function softDeleteById(
  id: string,
  organizationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('cost_centers' as never)
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}

export async function findUsersForCostCenter(
  costCenterId: string,
): Promise<Array<{ userId: string; email: string; firstName: string | null; lastName: string | null }>> {
  const { data, error } = await supabase
    .from('cost_center_users' as never)
    .select('user_id, users!inner(id, email, first_name, last_name)')
    .eq('cost_center_id', costCenterId);

  if (error) throw new Error(`Database error: ${error.message}`);

  return ((data ?? []) as Array<{
    user_id: string;
    users: { id: string; email: string; first_name: string | null; last_name: string | null };
  }>).map((row) => ({
    userId: row.user_id,
    email: row.users.email,
    firstName: row.users.first_name,
    lastName: row.users.last_name,
  }));
}

export async function replaceCostCenterUsers(
  costCenterId: string,
  userIds: string[],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('cost_center_users' as never)
    .delete()
    .eq('cost_center_id', costCenterId);

  if (deleteError) throw new Error(`Database error: ${deleteError.message}`);

  if (userIds.length === 0) return;

  const rows = userIds.map((userId) => ({ cost_center_id: costCenterId, user_id: userId }));
  const { error: insertError } = await supabase
    .from('cost_center_users' as never)
    .insert(rows as never);

  if (insertError) throw new Error(`Database error: ${insertError.message}`);
}
