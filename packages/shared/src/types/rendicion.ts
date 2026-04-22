export type RendicionStatus = 'pending' | 'approved' | 'rejected';
export type BackingType = 'boleta' | 'factura' | 'comprobante' | 'ticket' | 'otro';
export type RendicionDocumentValidationStatus = 'pending' | 'valid' | 'invalid';
export type AccountType = 'cuenta_corriente' | 'cuenta_vista' | 'cuenta_ahorro' | 'cuenta_rut';

export interface UserPaymentInfo {
  id: string;
  user_id: string;
  bank: string;
  account_type: AccountType;
  account_number: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface RendicionDocument {
  id: string;
  rendicion_id: string;
  organization_id: string;
  file_name: string;
  storage_path: string;
  storage_bucket: string;
  backing_type: BackingType | null;
  service_type: string | null;
  amount: number | null;
  corrected_amount: number | null;
  ai_validation_status: RendicionDocumentValidationStatus;
  ai_validation_notes: string | null;
  document_hash: string | null;
  is_duplicate: boolean;
  cost_center_id: string | null;
  accounting_id: string | null;
  is_pending_distribution: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Rendicion {
  id: string;
  organization_id: string;
  created_by_user_id: string;
  user_payment_info_id: string | null;
  status: RendicionStatus;
  ai_validated: boolean;
  total_amount: number | null;
  rejection_notes: string | null;
  approved_by_user_id: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  documents?: RendicionDocument[];
  document_count?: number;
}
