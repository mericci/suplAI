export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      accounting_ids: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string
          external_id: string
          id: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description: string
          external_id: string
          id?: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string
          external_id?: string
          id?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "accounting_ids_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_items: {
        Row: {
          amount: number
          created_at: string
          currency: string
          deleted_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string
          periodicity: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          periodicity?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          deleted_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          periodicity?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "budget_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_items_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_center_users: {
        Row: {
          cost_center_id: string
          created_at: string
          user_id: string
        }
        Insert: {
          cost_center_id: string
          created_at?: string
          user_id: string
        }
        Update: {
          cost_center_id?: string
          created_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_center_users_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cost_center_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      cost_centers: {
        Row: {
          created_at: string
          deleted_at: string | null
          external_id: string
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          external_id: string
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          external_id?: string
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cost_centers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_accounting_id_distributions: {
        Row: {
          accounting_id: string
          amount: number
          created_at: string
          id: string
          invoice_id: string
          organization_id: string
          percentage: number | null
          updated_at: string
        }
        Insert: {
          accounting_id: string
          amount: number
          created_at?: string
          id?: string
          invoice_id: string
          organization_id: string
          percentage?: number | null
          updated_at?: string
        }
        Update: {
          accounting_id?: string
          amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          organization_id?: string
          percentage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_accounting_id_distributions_accounting_id_fkey"
            columns: ["accounting_id"]
            isOneToOne: false
            referencedRelation: "accounting_ids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_accounting_id_distributions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_accounting_id_distributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_comments: {
        Row: {
          content: string
          created_at: string
          deleted_at: string | null
          id: string
          invoice_id: string
          organization_id: string
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          content: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          invoice_id: string
          organization_id: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          invoice_id?: string
          organization_id?: string
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_comments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_cost_center_distributions: {
        Row: {
          amount: number
          cost_center_id: string
          created_at: string
          id: string
          invoice_id: string
          organization_id: string
          percentage: number | null
          updated_at: string
        }
        Insert: {
          amount: number
          cost_center_id: string
          created_at?: string
          id?: string
          invoice_id: string
          organization_id: string
          percentage?: number | null
          updated_at?: string
        }
        Update: {
          amount?: number
          cost_center_id?: string
          created_at?: string
          id?: string
          invoice_id?: string
          organization_id?: string
          percentage?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_cost_center_distributions_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_cost_center_distributions_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_cost_center_distributions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_documents: {
        Row: {
          created_at: string
          deleted_at: string | null
          description: string | null
          file_name: string
          id: string
          invoice_id: string
          organization_id: string
          storage_bucket: string
          storage_path: string
          uploaded_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          file_name: string
          id?: string
          invoice_id: string
          organization_id: string
          storage_bucket: string
          storage_path: string
          uploaded_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          file_name?: string
          id?: string
          invoice_id?: string
          organization_id?: string
          storage_bucket?: string
          storage_path?: string
          uploaded_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_documents_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_documents_uploaded_by_user_id_fkey"
            columns: ["uploaded_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_events: {
        Row: {
          actor_user_id: string | null
          event_type: string
          id: string
          invoice_id: string
          metadata: Json | null
          occurred_at: string
          organization_id: string
        }
        Insert: {
          actor_user_id?: string | null
          event_type: string
          id?: string
          invoice_id: string
          metadata?: Json | null
          occurred_at?: string
          organization_id: string
        }
        Update: {
          actor_user_id?: string | null
          event_type?: string
          id?: string
          invoice_id?: string
          metadata?: Json | null
          occurred_at?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_events_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_events_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          accounting_id: string | null
          ai_validation_notes: string | null
          ai_validation_status: string | null
          approved_at: string | null
          approved_by_user_id: string | null
          cost_center_id: string | null
          created_at: string
          deleted_at: string | null
          document_number: string
          document_type: string
          document_type_number: number
          dte_xml: string | null
          due_date: string | null
          executive_title_date: string | null
          external_unique_key: string
          gross_amount: number | null
          id: string
          issue_date: string
          issuer_tax_identifier: string
          net_amount: number | null
          organization_id: string
          paid_at: string | null
          receiver_tax_identifier: string
          status: Database["public"]["Enums"]["invoice_status"]
          supplier_id: string
          tax_amount: number | null
          updated_at: string
        }
        Insert: {
          accounting_id?: string | null
          ai_validation_notes?: string | null
          ai_validation_status?: string | null
          approved_at?: string | null
          approved_by_user_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          deleted_at?: string | null
          document_number: string
          document_type: string
          document_type_number: number
          dte_xml?: string | null
          due_date?: string | null
          executive_title_date?: string | null
          external_unique_key: string
          gross_amount?: number | null
          id?: string
          issue_date: string
          issuer_tax_identifier: string
          net_amount?: number | null
          organization_id: string
          paid_at?: string | null
          receiver_tax_identifier: string
          status?: Database["public"]["Enums"]["invoice_status"]
          supplier_id: string
          tax_amount?: number | null
          updated_at?: string
        }
        Update: {
          accounting_id?: string | null
          ai_validation_notes?: string | null
          ai_validation_status?: string | null
          approved_at?: string | null
          approved_by_user_id?: string | null
          cost_center_id?: string | null
          created_at?: string
          deleted_at?: string | null
          document_number?: string
          document_type?: string
          document_type_number?: number
          dte_xml?: string | null
          due_date?: string | null
          executive_title_date?: string | null
          external_unique_key?: string
          gross_amount?: number | null
          id?: string
          issue_date?: string
          issuer_tax_identifier?: string
          net_amount?: number | null
          organization_id?: string
          paid_at?: string | null
          receiver_tax_identifier?: string
          status?: Database["public"]["Enums"]["invoice_status"]
          supplier_id?: string
          tax_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_accounting_id_fkey"
            columns: ["accounting_id"]
            isOneToOne: false
            referencedRelation: "accounting_ids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_approved_by_user_id_fkey"
            columns: ["approved_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      nomina_invoices: {
        Row: {
          created_at: string
          id: string
          invoice_id: string
          nomina_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invoice_id: string
          nomina_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invoice_id?: string
          nomina_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "nomina_invoices_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nomina_invoices_nomina_id_fkey"
            columns: ["nomina_id"]
            isOneToOne: false
            referencedRelation: "nominas"
            referencedColumns: ["id"]
          },
        ]
      }
      nominas: {
        Row: {
          created_at: string
          created_by_user_id: string
          deleted_at: string | null
          id: string
          invoice_count: number
          organization_id: string
          paid_at: string | null
          paid_by_user_id: string | null
          status: Database["public"]["Enums"]["nomina_status"]
          total_amount: number
          updated_at: string
          voucher_storage_bucket: string | null
          voucher_storage_path: string | null
        }
        Insert: {
          created_at?: string
          created_by_user_id: string
          deleted_at?: string | null
          id?: string
          invoice_count: number
          organization_id: string
          paid_at?: string | null
          paid_by_user_id?: string | null
          status?: Database["public"]["Enums"]["nomina_status"]
          total_amount: number
          updated_at?: string
          voucher_storage_bucket?: string | null
          voucher_storage_path?: string | null
        }
        Update: {
          created_at?: string
          created_by_user_id?: string
          deleted_at?: string | null
          id?: string
          invoice_count?: number
          organization_id?: string
          paid_at?: string | null
          paid_by_user_id?: string | null
          status?: Database["public"]["Enums"]["nomina_status"]
          total_amount?: number
          updated_at?: string
          voucher_storage_bucket?: string | null
          voucher_storage_path?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "nominas_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nominas_paid_by_user_id_fkey"
            columns: ["paid_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_rules: {
        Row: {
          ai_approve_action: string
          ai_max_amount: number | null
          ai_tolerance_pct: number
          created_at: string
          deleted_at: string | null
          id: string
          max_amount: number | null
          merito_action: string
          merito_alert_days_before: number | null
          merito_alert_emails: string[] | null
          merito_alert_enabled: boolean
          merito_completed_action: string
          merito_days_before: number | null
          min_amount: number
          notify_sii_on_approve: boolean
          notify_sii_on_reject: boolean
          org_id: string
          supplier_id: string | null
          updated_at: string
        }
        Insert: {
          ai_approve_action?: string
          ai_max_amount?: number | null
          ai_tolerance_pct?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          max_amount?: number | null
          merito_action?: string
          merito_alert_days_before?: number | null
          merito_alert_emails?: string[] | null
          merito_alert_enabled?: boolean
          merito_completed_action?: string
          merito_days_before?: number | null
          min_amount?: number
          notify_sii_on_approve?: boolean
          notify_sii_on_reject?: boolean
          org_id: string
          supplier_id?: string | null
          updated_at?: string
        }
        Update: {
          ai_approve_action?: string
          ai_max_amount?: number | null
          ai_tolerance_pct?: number
          created_at?: string
          deleted_at?: string | null
          id?: string
          max_amount?: number | null
          merito_action?: string
          merito_alert_days_before?: number | null
          merito_alert_emails?: string[] | null
          merito_alert_enabled?: boolean
          merito_completed_action?: string
          merito_days_before?: number | null
          min_amount?: number
          notify_sii_on_approve?: boolean
          notify_sii_on_reject?: boolean
          org_id?: string
          supplier_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_rules_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_rules_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_suppliers: {
        Row: {
          created_at: string
          organization_id: string
          supplier_id: string
        }
        Insert: {
          created_at?: string
          organization_id: string
          supplier_id: string
        }
        Update: {
          created_at?: string
          organization_id?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_suppliers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_suppliers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      rendicion_documents: {
        Row: {
          accounting_id: string | null
          ai_validation_notes: string | null
          ai_validation_status: string
          amount: number | null
          backing_type: string | null
          corrected_amount: number | null
          cost_center_id: string | null
          created_at: string
          deleted_at: string | null
          file_name: string
          id: string
          is_duplicate: boolean
          is_pending_distribution: boolean
          organization_id: string
          rendicion_id: string
          service_type: string | null
          storage_bucket: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          accounting_id?: string | null
          ai_validation_notes?: string | null
          ai_validation_status?: string
          amount?: number | null
          backing_type?: string | null
          corrected_amount?: number | null
          cost_center_id?: string | null
          created_at?: string
          deleted_at?: string | null
          file_name: string
          id?: string
          is_duplicate?: boolean
          is_pending_distribution?: boolean
          organization_id: string
          rendicion_id: string
          service_type?: string | null
          storage_bucket: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          accounting_id?: string | null
          ai_validation_notes?: string | null
          ai_validation_status?: string
          amount?: number | null
          backing_type?: string | null
          corrected_amount?: number | null
          cost_center_id?: string | null
          created_at?: string
          deleted_at?: string | null
          file_name?: string
          id?: string
          is_duplicate?: boolean
          is_pending_distribution?: boolean
          organization_id?: string
          rendicion_id?: string
          service_type?: string | null
          storage_bucket?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rendicion_documents_accounting_id_fkey"
            columns: ["accounting_id"]
            isOneToOne: false
            referencedRelation: "accounting_ids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendicion_documents_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendicion_documents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendicion_documents_rendicion_id_fkey"
            columns: ["rendicion_id"]
            isOneToOne: false
            referencedRelation: "rendiciones"
            referencedColumns: ["id"]
          },
        ]
      }
      rendiciones: {
        Row: {
          ai_validated: boolean
          approved_at: string | null
          approved_by_user_id: string | null
          created_at: string
          created_by_user_id: string
          deleted_at: string | null
          id: string
          organization_id: string
          rejection_notes: string | null
          status: string
          total_amount: number | null
          updated_at: string
          user_payment_info_id: string | null
        }
        Insert: {
          ai_validated?: boolean
          approved_at?: string | null
          approved_by_user_id?: string | null
          created_at?: string
          created_by_user_id: string
          deleted_at?: string | null
          id?: string
          organization_id: string
          rejection_notes?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_payment_info_id?: string | null
        }
        Update: {
          ai_validated?: boolean
          approved_at?: string | null
          approved_by_user_id?: string | null
          created_at?: string
          created_by_user_id?: string
          deleted_at?: string | null
          id?: string
          organization_id?: string
          rejection_notes?: string | null
          status?: string
          total_amount?: number | null
          updated_at?: string
          user_payment_info_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rendiciones_approved_by_user_id_fkey"
            columns: ["approved_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendiciones_created_by_user_id_fkey"
            columns: ["created_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendiciones_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rendiciones_user_payment_info_id_fkey"
            columns: ["user_payment_info_id"]
            isOneToOne: false
            referencedRelation: "user_payment_info"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          last_sii_sync_at: string | null
          legal_name: string
          tax_authority_password_enc: string | null
          tax_authority_username: string | null
          tax_identifier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_sii_sync_at?: string | null
          legal_name: string
          tax_authority_password_enc?: string | null
          tax_authority_username?: string | null
          tax_identifier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          last_sii_sync_at?: string | null
          legal_name?: string
          tax_authority_password_enc?: string | null
          tax_authority_username?: string | null
          tax_identifier?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_accounting_ids: {
        Row: {
          accounting_id: string
          created_at: string
          deleted_at: string | null
          distribution_type: string
          id: string
          organization_id: string
          percentage: number | null
          sort_order: number
          supplier_id: string
          updated_at: string
        }
        Insert: {
          accounting_id: string
          created_at?: string
          deleted_at?: string | null
          distribution_type?: string
          id?: string
          organization_id: string
          percentage?: number | null
          sort_order?: number
          supplier_id: string
          updated_at?: string
        }
        Update: {
          accounting_id?: string
          created_at?: string
          deleted_at?: string | null
          distribution_type?: string
          id?: string
          organization_id?: string
          percentage?: number | null
          sort_order?: number
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_accounting_ids_accounting_id_fkey"
            columns: ["accounting_id"]
            isOneToOne: false
            referencedRelation: "accounting_ids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_accounting_ids_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_accounting_ids_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_cost_centers: {
        Row: {
          cost_center_id: string
          created_at: string
          deleted_at: string | null
          distribution_type: string
          id: string
          organization_id: string
          percentage: number | null
          sort_order: number
          supplier_id: string
          updated_at: string
        }
        Insert: {
          cost_center_id: string
          created_at?: string
          deleted_at?: string | null
          distribution_type?: string
          id?: string
          organization_id: string
          percentage?: number | null
          sort_order?: number
          supplier_id: string
          updated_at?: string
        }
        Update: {
          cost_center_id?: string
          created_at?: string
          deleted_at?: string | null
          distribution_type?: string
          id?: string
          organization_id?: string
          percentage?: number | null
          sort_order?: number
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_cost_centers_cost_center_id_fkey"
            columns: ["cost_center_id"]
            isOneToOne: false
            referencedRelation: "cost_centers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_cost_centers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_cost_centers_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_documents: {
        Row: {
          amounts: Json
          created_at: string
          deleted_at: string | null
          document_role: string
          document_type: string | null
          file_name: string
          id: string
          is_current: boolean
          service_category: string | null
          service_description: string | null
          storage_bucket: string
          storage_path: string
          supplier_id: string
          tariff_detail: string | null
          tariff_type: string | null
          updated_at: string
        }
        Insert: {
          amounts?: Json
          created_at?: string
          deleted_at?: string | null
          document_role?: string
          document_type?: string | null
          file_name: string
          id?: string
          is_current?: boolean
          service_category?: string | null
          service_description?: string | null
          storage_bucket?: string
          storage_path: string
          supplier_id: string
          tariff_detail?: string | null
          tariff_type?: string | null
          updated_at?: string
        }
        Update: {
          amounts?: Json
          created_at?: string
          deleted_at?: string | null
          document_role?: string
          document_type?: string | null
          file_name?: string
          id?: string
          is_current?: boolean
          service_category?: string | null
          service_description?: string | null
          storage_bucket?: string
          storage_path?: string
          supplier_id?: string
          tariff_detail?: string | null
          tariff_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_documents_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_payment_info: {
        Row: {
          account_holder_name: string
          account_number: string
          account_type: string
          bank: string
          created_at: string
          currency: string
          deleted_at: string | null
          email: string | null
          id: string
          organization_id: string
          supplier_id: string
          tax_identifier: string
          updated_at: string
        }
        Insert: {
          account_holder_name: string
          account_number: string
          account_type: string
          bank: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          organization_id: string
          supplier_id: string
          tax_identifier: string
          updated_at?: string
        }
        Update: {
          account_holder_name?: string
          account_number?: string
          account_type?: string
          bank?: string
          created_at?: string
          currency?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          organization_id?: string
          supplier_id?: string
          tax_identifier?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_payment_info_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_payment_info_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          legal_name: string
          tax_identifier: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          legal_name: string
          tax_identifier: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          legal_name?: string
          tax_identifier?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_payment_info: {
        Row: {
          account_number: string
          account_type: string
          bank: string
          created_at: string
          deleted_at: string | null
          id: string
          is_default: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          account_number: string
          account_type: string
          bank: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_default?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          account_number?: string
          account_type?: string
          bank?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          is_default?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_payment_info_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          deleted_at: string | null
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          metadata: Json | null
          name: string | null
          organization_id: string | null
          phone: string | null
          role: string
          rut: string | null
          status: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          name?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: string
          rut?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          metadata?: Json | null
          name?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: string
          rut?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      invoice_status: "pending" | "approved" | "rejected" | "paid"
      nomina_status: "pending" | "paid"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string | null
        }
        Relationships: []
      }
      buckets_analytics: {
        Row: {
          created_at: string
          deleted_at: string | null
          format: string
          id: string
          name: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          format?: string
          id?: string
          name?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      buckets_vectors: {
        Row: {
          created_at: string
          id: string
          type: Database["storage"]["Enums"]["buckettype"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          type?: Database["storage"]["Enums"]["buckettype"]
          updated_at?: string
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          user_metadata: Json | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          user_metadata?: Json | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads: {
        Row: {
          bucket_id: string
          created_at: string
          id: string
          in_progress_size: number
          key: string
          owner_id: string | null
          upload_signature: string
          user_metadata: Json | null
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          id: string
          in_progress_size?: number
          key: string
          owner_id?: string | null
          upload_signature: string
          user_metadata?: Json | null
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          id?: string
          in_progress_size?: number
          key?: string
          owner_id?: string | null
          upload_signature?: string
          user_metadata?: Json | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
      s3_multipart_uploads_parts: {
        Row: {
          bucket_id: string
          created_at: string
          etag: string
          id: string
          key: string
          owner_id: string | null
          part_number: number
          size: number
          upload_id: string
          version: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          etag: string
          id?: string
          key: string
          owner_id?: string | null
          part_number: number
          size?: number
          upload_id: string
          version: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          etag?: string
          id?: string
          key?: string
          owner_id?: string | null
          part_number?: number
          size?: number
          upload_id?: string
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "s3_multipart_uploads_parts_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "s3_multipart_uploads_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "s3_multipart_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      vector_indexes: {
        Row: {
          bucket_id: string
          created_at: string
          data_type: string
          dimension: number
          distance_metric: string
          id: string
          metadata_configuration: Json | null
          name: string
          updated_at: string
        }
        Insert: {
          bucket_id: string
          created_at?: string
          data_type: string
          dimension: number
          distance_metric: string
          id?: string
          metadata_configuration?: Json | null
          name: string
          updated_at?: string
        }
        Update: {
          bucket_id?: string
          created_at?: string
          data_type?: string
          dimension?: number
          distance_metric?: string
          id?: string
          metadata_configuration?: Json | null
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vector_indexes_bucket_id_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets_vectors"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: { bucketid: string; metadata: Json; name: string; owner: string }
        Returns: undefined
      }
      delete_leaf_prefixes: {
        Args: { bucket_ids: string[]; names: string[] }
        Returns: undefined
      }
      extension: { Args: { name: string }; Returns: string }
      filename: { Args: { name: string }; Returns: string }
      foldername: { Args: { name: string }; Returns: string[] }
      get_common_prefix: {
        Args: { p_delimiter: string; p_key: string; p_prefix: string }
        Returns: string
      }
      get_level: { Args: { name: string }; Returns: number }
      get_prefix: { Args: { name: string }; Returns: string }
      get_prefixes: { Args: { name: string }; Returns: string[] }
      get_size_by_bucket: {
        Args: never
        Returns: {
          bucket_id: string
          size: number
        }[]
      }
      list_multipart_uploads_with_delimiter: {
        Args: {
          bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_key_token?: string
          next_upload_token?: string
          prefix_param: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
        }[]
      }
      list_objects_with_delimiter: {
        Args: {
          _bucket_id: string
          delimiter_param: string
          max_keys?: number
          next_token?: string
          prefix_param: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      operation: { Args: never; Returns: string }
      search: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_by_timestamp: {
        Args: {
          p_bucket_id: string
          p_level: number
          p_limit: number
          p_prefix: string
          p_sort_column: string
          p_sort_column_after: string
          p_sort_order: string
          p_start_after: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_legacy_v1: {
        Args: {
          bucketname: string
          levels?: number
          limits?: number
          offsets?: number
          prefix: string
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          created_at: string
          id: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
      search_v2: {
        Args: {
          bucket_name: string
          levels?: number
          limits?: number
          prefix: string
          sort_column?: string
          sort_column_after?: string
          sort_order?: string
          start_after?: string
        }
        Returns: {
          created_at: string
          id: string
          key: string
          last_accessed_at: string
          metadata: Json
          name: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      buckettype: "STANDARD" | "ANALYTICS" | "VECTOR"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      invoice_status: ["pending", "approved", "rejected", "paid"],
      nomina_status: ["pending", "paid"],
    },
  },
  storage: {
    Enums: {
      buckettype: ["STANDARD", "ANALYTICS", "VECTOR"],
    },
  },
} as const
