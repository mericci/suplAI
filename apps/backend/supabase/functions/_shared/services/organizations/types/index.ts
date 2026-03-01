/**
 * Organization Service Types
 *
 * Types used exclusively within the organizations service.
 */

import type { Database } from '../../../types/supabase.ts';

type OrgRow = Database['public']['Tables']['organizations']['Row'];

/**
 * Safe organization representation for API responses.
 * Strips the encrypted password field and replaces it with a boolean flag.
 */
export interface OrganizationPublic {
  id: string;
  legalName: string;
  taxIdentifier: string;
  taxAuthorityUsername: string | null;
  /** True if tax authority credentials (username + password) are stored. */
  hasCredentials: boolean;
  lastSiiSyncAt: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface OrganizationSearchParams {
  id?: string;
  taxIdentifier?: string;
}

/**
 * Maps a DB row to the safe public representation.
 * NEVER include tax_authority_password_enc in responses.
 */
export function toPublic(org: OrgRow): OrganizationPublic {
  return {
    id: org.id,
    legalName: org.legal_name,
    taxIdentifier: org.tax_identifier,
    taxAuthorityUsername: org.tax_authority_username,
    hasCredentials: !!(
      org.tax_authority_username && org.tax_authority_password_enc
    ),
    lastSiiSyncAt: org.last_sii_sync_at,
    createdAt: org.created_at,
    updatedAt: org.updated_at,
    deletedAt: org.deleted_at,
  };
}
