/**
 * Cost Center Database Queries
 *
 * Data access layer for cost center operations.
 * All queries are scoped to an organizationId (multi-tenant isolation).
 * All queries filter by deleted_at IS NULL (soft delete pattern).
 */

import { supabase } from '../lib/supabase.js';

// Use generic types until supabase gen types is run with the new migration
export interface CostCenterRow {
  id: string;
  organization_id: string;
  external_id: string;
  name: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CostCenterUserRow {
  cost_center_id: string;
  user_id: string;
  created_at: string;
}

export interface CreateCostCenterData {
  organization_id: string;
  external_id: string;
  name: string;
}

export interface UpdateCostCenterData {
  external_id?: string;
  name?: string;
  updated_at?: string;
}

/**
 * List all active cost centers for an organization.
 */
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

/**
 * Find an active cost center by ID, scoped to an organization.
 */
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

/**
 * Create a new cost center.
 */
export async function create(data: CreateCostCenterData): Promise<CostCenterRow> {
  const { data: row, error } = await supabase
    .from('cost_centers' as never)
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return row as CostCenterRow;
}

/**
 * Update a cost center by ID, scoped to an organization.
 */
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

/**
 * Soft-delete a cost center by ID, scoped to an organization.
 */
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

/**
 * Find all cost center IDs that a user belongs to.
 */
export async function findCostCenterIdsByUser(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('cost_center_users' as never)
    .select('cost_center_id')
    .eq('user_id', userId);

  if (error) throw new Error(`Database error: ${error.message}`);
  return ((data ?? []) as Array<{ cost_center_id: string }>).map((row) => row.cost_center_id);
}

/**
 * Find all users assigned to a cost center.
 */
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

/**
 * Replace all user assignments for a cost center.
 * Deletes existing assignments then inserts the new set.
 */
export async function replaceCostCenterUsers(
  costCenterId: string,
  userIds: string[],
): Promise<void> {
  // Delete all existing assignments
  const { error: deleteError } = await supabase
    .from('cost_center_users' as never)
    .delete()
    .eq('cost_center_id', costCenterId);

  if (deleteError) throw new Error(`Database error: ${deleteError.message}`);

  if (userIds.length === 0) return;

  // Insert new assignments
  const rows = userIds.map((userId) => ({ cost_center_id: costCenterId, user_id: userId }));
  const { error: insertError } = await supabase
    .from('cost_center_users' as never)
    .insert(rows as never);

  if (insertError) throw new Error(`Database error: ${insertError.message}`);
}
