/**
 * Supabase Database Types
 *
 * Generate these types from your Supabase schema:
 * supabase gen types typescript --local > src/types/supabase.ts
 *
 * The types below include both the original users table and the
 * new domain tables added in the invoice-management-domain feature.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type InvoiceStatus = 'pending' | 'approved' | 'rejected' | 'paid';

export interface Database {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          legal_name: string;
          tax_identifier: string;
          tax_authority_username: string | null;
          /** AES-256-GCM encrypted. NEVER expose in API responses. */
          tax_authority_password_enc: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
          last_sii_sync_at: string | null;
        };
        Insert: {
          id?: string;
          legal_name: string;
          tax_identifier: string;
          tax_authority_username?: string | null;
          tax_authority_password_enc?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          last_sii_sync_at?: string | null;
        };
        Update: {
          id?: string;
          legal_name?: string;
          tax_identifier?: string;
          tax_authority_username?: string | null;
          tax_authority_password_enc?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
          last_sii_sync_at?: string | null;
        };
      };
      users: {
        Row: {
          id: string;
          organization_id: string | null;
          email: string;
          first_name: string | null;
          last_name: string | null;
          name: string | null;
          avatar_url: string | null;
          phone: string | null;
          role: string;
          status: string;
          metadata: Json | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          email: string;
          first_name?: string | null;
          last_name?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: string;
          status?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string | null;
          email?: string;
          first_name?: string | null;
          last_name?: string | null;
          name?: string | null;
          avatar_url?: string | null;
          phone?: string | null;
          role?: string;
          status?: string;
          metadata?: Json | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      suppliers: {
        Row: {
          id: string;
          legal_name: string;
          tax_identifier: string;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          legal_name: string;
          tax_identifier: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          legal_name?: string;
          tax_identifier?: string;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      invoices: {
        Row: {
          id: string;
          organization_id: string;
          supplier_id: string;
          external_unique_key: string;
          issuer_tax_identifier: string;
          receiver_tax_identifier: string;
          document_type: string;
          document_type_number: number;
          document_number: string;
          issue_date: string;
          due_date: string | null;
          /** Auto-computed: issue_date + 8 days. Read-only. */
          executive_title_date: string;
          status: InvoiceStatus;
          approved_by_user_id: string | null;
          approved_at: string | null;
          net_amount: number | null;
          tax_amount: number | null;
          gross_amount: number | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          supplier_id: string;
          external_unique_key: string;
          issuer_tax_identifier: string;
          receiver_tax_identifier: string;
          document_type: string;
          document_type_number: number;
          document_number: string;
          issue_date: string;
          due_date?: string | null;
          /** executive_title_date is a generated column — never set manually. */
          status?: InvoiceStatus;
          approved_by_user_id?: string | null;
          approved_at?: string | null;
          net_amount?: number | null;
          tax_amount?: number | null;
          gross_amount?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          supplier_id?: string;
          external_unique_key?: string;
          issuer_tax_identifier?: string;
          receiver_tax_identifier?: string;
          document_type?: string;
          document_type_number?: number;
          document_number?: string;
          issue_date?: string;
          due_date?: string | null;
          /** executive_title_date is a generated column — never set manually. */
          status?: InvoiceStatus;
          approved_by_user_id?: string | null;
          approved_at?: string | null;
          net_amount?: number | null;
          tax_amount?: number | null;
          gross_amount?: number | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      budget_items: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          description: string | null;
          amount: number;
          currency: string;
          periodicity: 'monthly' | 'quarterly' | 'annual';
          supplier_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          description?: string | null;
          amount: number;
          currency?: string;
          periodicity?: 'monthly' | 'quarterly' | 'annual';
          supplier_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          name?: string;
          description?: string | null;
          amount?: number;
          currency?: string;
          periodicity?: 'monthly' | 'quarterly' | 'annual';
          supplier_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
    };
    Views: {
      // Add your view types here
    };
    Functions: {
      // Add your function types here
    };
    Enums: {
      invoice_status: InvoiceStatus;
    };
  };
}
