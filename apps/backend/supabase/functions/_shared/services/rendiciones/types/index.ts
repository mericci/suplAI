import type { Database } from '../../../types/supabase.ts';

export type RendicionRow = Database['public']['Tables']['rendiciones']['Row'];
export type RendicionDocumentRow = Database['public']['Tables']['rendicion_documents']['Row'];

export interface RendicionPublic extends RendicionRow {
  documents?: RendicionDocumentRow[];
  document_count?: number;
  creator_name?: string;
}

export interface UploadRendicionDocumentResult {
  document: RendicionDocumentRow;
  totalAmount: number;
}
