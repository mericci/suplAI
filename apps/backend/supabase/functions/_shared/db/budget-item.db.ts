/**
 * Budget Item Database Queries
 *
 * Data access layer for budget item operations.
 * All queries are scoped to an organizationId (multi-tenant isolation).
 * All queries filter by deleted_at IS NULL (soft delete pattern).
 */

import { supabaseAdmin } from '../lib/supabase.ts';
import type { Database } from '../types/supabase.ts';

type BudgetItem = Database['public']['Tables']['budget_items']['Row'];
type CreateBudgetItemInput = Database['public']['Tables']['budget_items']['Insert'];

const supabase = supabaseAdmin();

/**
 * List all active budget items for an organization.
 */
export async function findAllByOrganization(
  organizationId: string,
): Promise<BudgetItem[]> {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true });

  if (error) throw new Error(`Database error: ${error.message}`);
  return data ?? [];
}

/**
 * Find an active budget item by ID, scoped to an organization.
 */
export async function findById(
  id: string,
  organizationId: string,
): Promise<BudgetItem | null> {
  const { data, error } = await supabase
    .from('budget_items')
    .select('*')
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}

/**
 * Create a new budget item.
 */
export async function create(data: CreateBudgetItemInput): Promise<BudgetItem> {
  const { data: item, error } = await supabase
    .from('budget_items')
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return item as BudgetItem;
}

/**
 * Soft-delete a budget item by ID, scoped to an organization.
 */
export async function softDeleteById(
  id: string,
  organizationId: string,
): Promise<void> {
  const { error } = await supabase
    .from('budget_items')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}
