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
export type NominaStatus = 'pending' | 'paid';
export type MeritoAction = 'nothing' | 'reject_sii_and_supl' | 'reject_supl_only';
export type MeritoCompletedAction = 'nothing' | 'wait_manual' | 'auto_approve';
export type AiApproveAction = 'nothing' | 'mark_approved';

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
      user_payment_info: {
        Row: {
          id: string;
          user_id: string;
          bank: string;
          account_type: 'cuenta_corriente' | 'cuenta_vista' | 'cuenta_ahorro' | 'cuenta_rut';
          account_number: string;
          is_default: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          bank: string;
          account_type: 'cuenta_corriente' | 'cuenta_vista' | 'cuenta_ahorro' | 'cuenta_rut';
          account_number: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          bank?: string;
          account_type?: 'cuenta_corriente' | 'cuenta_vista' | 'cuenta_ahorro' | 'cuenta_rut';
          account_number?: string;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
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
          rut: string | null;
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
          rut?: string | null;
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
          rut?: string | null;
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
      supplier_payment_info: {
        Row: {
          id: string;
          supplier_id: string;
          organization_id: string;
          account_holder_name: string;
          tax_identifier: string;
          bank: string;
          account_type: 'cuenta_corriente' | 'cuenta_vista' | 'cuenta_ahorro' | 'cuenta_rut';
          account_number: string;
          currency: 'CLP' | 'USD' | 'UF';
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          supplier_id: string;
          organization_id: string;
          account_holder_name: string;
          tax_identifier: string;
          bank: string;
          account_type: 'cuenta_corriente' | 'cuenta_vista' | 'cuenta_ahorro' | 'cuenta_rut';
          account_number: string;
          currency?: 'CLP' | 'USD' | 'UF';
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          supplier_id?: string;
          organization_id?: string;
          account_holder_name?: string;
          tax_identifier?: string;
          bank?: string;
          account_type?: 'cuenta_corriente' | 'cuenta_vista' | 'cuenta_ahorro' | 'cuenta_rut';
          account_number?: string;
          currency?: 'CLP' | 'USD' | 'UF';
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
          paid_at: string | null;
          net_amount: number | null;
          tax_amount: number | null;
          gross_amount: number | null;
          ai_validation_status: 'ok' | 'error' | null;
          ai_validation_notes: string | null;
          dte_xml: string | null;
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
          paid_at?: string | null;
          net_amount?: number | null;
          tax_amount?: number | null;
          gross_amount?: number | null;
          ai_validation_status?: 'ok' | 'error' | null;
          ai_validation_notes?: string | null;
          dte_xml?: string | null;
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
          paid_at?: string | null;
          net_amount?: number | null;
          tax_amount?: number | null;
          gross_amount?: number | null;
          ai_validation_status?: 'ok' | 'error' | null;
          ai_validation_notes?: string | null;
          dte_xml?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      nominas: {
        Row: {
          id: string;
          organization_id: string;
          created_by_user_id: string;
          status: NominaStatus;
          total_amount: number;
          invoice_count: number;
          voucher_storage_path: string | null;
          voucher_storage_bucket: string | null;
          paid_at: string | null;
          paid_by_user_id: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by_user_id: string;
          status?: NominaStatus;
          total_amount: number;
          invoice_count: number;
          voucher_storage_path?: string | null;
          voucher_storage_bucket?: string | null;
          paid_at?: string | null;
          paid_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          created_by_user_id?: string;
          status?: NominaStatus;
          total_amount?: number;
          invoice_count?: number;
          voucher_storage_path?: string | null;
          voucher_storage_bucket?: string | null;
          paid_at?: string | null;
          paid_by_user_id?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      nomina_invoices: {
        Row: {
          id: string;
          nomina_id: string;
          invoice_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          nomina_id: string;
          invoice_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nomina_id?: string;
          invoice_id?: string;
          created_at?: string;
        };
      };
      rendicion_documents: {
        Row: {
          id: string;
          rendicion_id: string;
          organization_id: string;
          file_name: string;
          storage_path: string;
          storage_bucket: string;
          backing_type: 'boleta' | 'factura' | 'comprobante' | 'ticket' | 'otro' | null;
          service_type: string | null;
          amount: number | null;
          corrected_amount: number | null;
          ai_validation_status: 'pending' | 'valid' | 'invalid';
          ai_validation_notes: string | null;
          document_hash: string | null;
          is_duplicate: boolean;
          cost_center_id: string | null;
          accounting_id: string | null;
          is_pending_distribution: boolean;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          rendicion_id: string;
          organization_id: string;
          file_name: string;
          storage_path: string;
          storage_bucket: string;
          backing_type?: 'boleta' | 'factura' | 'comprobante' | 'ticket' | 'otro' | null;
          service_type?: string | null;
          amount?: number | null;
          corrected_amount?: number | null;
          ai_validation_status?: 'pending' | 'valid' | 'invalid';
          ai_validation_notes?: string | null;
          document_hash?: string | null;
          is_duplicate?: boolean;
          cost_center_id?: string | null;
          accounting_id?: string | null;
          is_pending_distribution?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          rendicion_id?: string;
          organization_id?: string;
          file_name?: string;
          storage_path?: string;
          storage_bucket?: string;
          backing_type?: 'boleta' | 'factura' | 'comprobante' | 'ticket' | 'otro' | null;
          service_type?: string | null;
          amount?: number | null;
          corrected_amount?: number | null;
          ai_validation_status?: 'pending' | 'valid' | 'invalid';
          ai_validation_notes?: string | null;
          document_hash?: string | null;
          is_duplicate?: boolean;
          cost_center_id?: string | null;
          accounting_id?: string | null;
          is_pending_distribution?: boolean;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
      };
      rendiciones: {
        Row: {
          id: string;
          organization_id: string;
          created_by_user_id: string;
          user_payment_info_id: string | null;
          status: 'draft' | 'pending' | 'approved' | 'rejected';
          ai_validated: boolean;
          total_amount: number | null;
          rejection_notes: string | null;
          submission_notes: string | null;
          approved_by_user_id: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by_user_id: string;
          user_payment_info_id?: string | null;
          status?: 'draft' | 'pending' | 'approved' | 'rejected';
          ai_validated?: boolean;
          total_amount?: number | null;
          rejection_notes?: string | null;
          submission_notes?: string | null;
          approved_by_user_id?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          created_by_user_id?: string;
          user_payment_info_id?: string | null;
          status?: 'draft' | 'pending' | 'approved' | 'rejected';
          ai_validated?: boolean;
          total_amount?: number | null;
          rejection_notes?: string | null;
          submission_notes?: string | null;
          approved_by_user_id?: string | null;
          approved_at?: string | null;
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
      organization_rules: {
        Row: {
          id: string;
          org_id: string;
          supplier_id: string | null;
          min_amount: number;
          max_amount: number | null;
          ai_tolerance_pct: number;
          ai_max_amount: number | null;
          notify_sii_on_approve: boolean;
          notify_sii_on_reject: boolean;
          merito_action: MeritoAction;
          merito_days_before: number | null;
          merito_alert_enabled: boolean;
          merito_alert_days_before: number | null;
          merito_alert_emails: string[] | null;
          merito_completed_action: MeritoCompletedAction;
          ai_approve_action: AiApproveAction;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          org_id: string;
          supplier_id?: string | null;
          min_amount?: number;
          max_amount?: number | null;
          ai_tolerance_pct?: number;
          ai_max_amount?: number | null;
          notify_sii_on_approve?: boolean;
          notify_sii_on_reject?: boolean;
          merito_action?: MeritoAction;
          merito_days_before?: number | null;
          merito_alert_enabled?: boolean;
          merito_alert_days_before?: number | null;
          merito_alert_emails?: string[] | null;
          merito_completed_action?: MeritoCompletedAction;
          ai_approve_action?: AiApproveAction;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          org_id?: string;
          supplier_id?: string | null;
          min_amount?: number;
          max_amount?: number | null;
          ai_tolerance_pct?: number;
          ai_max_amount?: number | null;
          notify_sii_on_approve?: boolean;
          notify_sii_on_reject?: boolean;
          merito_action?: MeritoAction;
          merito_days_before?: number | null;
          merito_alert_enabled?: boolean;
          merito_alert_days_before?: number | null;
          merito_alert_emails?: string[] | null;
          merito_completed_action?: MeritoCompletedAction;
          ai_approve_action?: AiApproveAction;
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
      nomina_status: NominaStatus;
    };
  };
}
