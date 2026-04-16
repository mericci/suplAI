/**
 * Organization Database Queries
 *
 * Data access layer for organization (tenant) operations.
 * All queries filter by deleted_at IS NULL (soft delete pattern).
 * The tax_authority_password_enc field is included in Row but MUST be
 * stripped before returning to API consumers (done in the action layer).
 */

import { supabaseAdmin } from '../lib/supabase.js';
import type { Database } from '../types/supabase.js';

type Organization = Database['public']['Tables']['organizations']['Row'];
type CreateOrgInput = Database['public']['Tables']['organizations']['Insert'];
type UpdateOrgInput = Database['public']['Tables']['organizations']['Update'];

const supabase = supabaseAdmin();

/**
 * Find an active organization by ID.
 */
export async function findById(id: string): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}

/**
 * Find an active organization by tax identifier.
 */
export async function findByTaxIdentifier(
  taxIdentifier: string,
): Promise<Organization | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('tax_identifier', taxIdentifier)
    .is('deleted_at', null)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Database error: ${error.message}`);
  }
  return data;
}

/**
 * Create a new organization.
 */
export async function create(data: CreateOrgInput): Promise<Organization> {
  const { data: org, error } = await supabase
    .from('organizations')
    .insert(data as never)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return org as Organization;
}

/**
 * Update an organization by ID.
 */
export async function update(
  id: string,
  data: UpdateOrgInput,
): Promise<Organization> {
  const { data: org, error } = await supabase
    .from('organizations')
    .update(data as never)
    .eq('id', id)
    .is('deleted_at', null)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return org as Organization;
}

/**
 * Soft-delete an organization by ID.
 */
export async function softDeleteById(id: string): Promise<void> {
  const { error } = await supabase
    .from('organizations')
    .update({ deleted_at: new Date().toISOString() } as never)
    .eq('id', id)
    .is('deleted_at', null);

  if (error) throw new Error(`Database error: ${error.message}`);
}

/**
 * List active organizations with pagination.
 */
export async function findAll(
  limit: number,
  offset: number,
  search?: string,
): Promise<{ organizations: Organization[]; total: number }> {
  let countQuery = supabase
    .from('organizations')
    .select('*', { count: 'exact', head: true })
    .is('deleted_at', null);

  let dataQuery = supabase
    .from('organizations')
    .select('*')
    .is('deleted_at', null);

  if (search) {
    const pattern = `%${search}%`;
    countQuery = countQuery.or(
      `legal_name.ilike.${pattern},tax_identifier.ilike.${pattern}`,
    );
    dataQuery = dataQuery.or(
      `legal_name.ilike.${pattern},tax_identifier.ilike.${pattern}`,
    );
  }

  const { count, error: countError } = await countQuery;
  if (countError) throw new Error(`Database error: ${countError.message}`);

  const { data, error } = await dataQuery
    .range(offset, offset + limit - 1)
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Database error: ${error.message}`);

  return {
    organizations: data ?? [],
    total: count ?? 0,
  };
}
