/**
 * User Database Queries
 *
 * Data access layer for user operations.
 * Users are scoped to an organization (multi-tenant).
 * All queries filter by deleted_at IS NULL (soft delete pattern).
 */

import { supabaseAdmin } from '../lib/supabase.ts';
import type { Database } from '../types/supabase.ts';

type User = Database['public']['Tables']['users']['Row'];
type CreateUserInput = Database['public']['Tables']['users']['Insert'];
type UpdateUserInput = Database['public']['Tables']['users']['Update'];

const supabase = supabaseAdmin();

/**
 * Find an active user by ID.
 */
export async function findById(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}

/**
 * Find an active user by ID, scoped to an organization.
 */
export async function findByIdInOrganization(
  userId: string,
  organizationId: string,
): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
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
 * Find an active user by email.
 */
export async function findByEmail(email: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}

/**
 * Create a new user.
 */
export async function create(userData: CreateUserInput): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert(userData as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return data as User;
}

/**
 * Update an active user.
 */
export async function update(
  userId: string,
  updates: UpdateUserInput,
): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .update(updates as never)
    .eq('id', userId)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return data as User;
}

/**
 * Soft-delete a user by ID.
 */
export async function softDeleteById(userId: string): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', userId)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}

/**
 * Hard-delete a user by ID (kept for backward compatibility; prefer softDeleteById).
 */
export async function deleteById(userId: string): Promise<void> {
  const { error } = await supabase.from('users').delete().eq('id', userId);
  if (error) throw new Error(`Database error: ${error.message}`);
}

/**
 * List active users in an organization with pagination.
 */
export async function findAllByOrganization(
  organizationId: string,
  limit: number,
  offset: number,
): Promise<{ users: User[]; total: number }> {
  const { count, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .is('deleted_at', null);

  if (countError) throw new Error(`Database error: ${countError.message}`);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('organization_id', organizationId)
    .is('deleted_at', null)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);

  return {
    users: data ?? [],
    total: count ?? 0,
  };
}

/**
 * List all active users with pagination (global, admin use only).
 */
export async function findAll(
  limit: number,
  offset: number,
): Promise<{ users: User[]; total: number }> {
  const { count, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  if (countError) throw new Error(`Database error: ${countError.message}`);

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .is('deleted_at', null)
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);

  return {
    users: data ?? [],
    total: count ?? 0,
  };
}
