import * as invoiceDb from '../../../db/invoice.db.ts';
import * as docDb from '../../../db/invoice-document.db.ts';
import type { InvoiceDocumentRow } from '../../../db/invoice-document.db.ts';
import { supabase } from '../../../lib/supabase.ts';

const BUCKET = 'invoice-documents';

export async function uploadInvoiceDocument(
  invoiceId: string,
  organizationId: string,
  uploadedByUserId: string,
  fileName: string,
  fileContent: Uint8Array,
  mimeType: string,
  description?: string,
): Promise<InvoiceDocumentRow> {
  const existing = await invoiceDb.findById(invoiceId, organizationId);
  if (!existing) throw new Error('Invoice not found');

  const storagePath = `${organizationId}/${invoiceId}/${Date.now()}-${fileName}`;

  const { error: uploadError } = await (supabase as any).storage
    .from(BUCKET)
    .upload(storagePath, fileContent, { contentType: mimeType, upsert: false });

  if (uploadError) throw new Error(`Storage error: ${uploadError.message}`);

  return docDb.createDocument({
    invoice_id: invoiceId,
    organization_id: organizationId,
    uploaded_by_user_id: uploadedByUserId,
    file_name: fileName,
    storage_path: storagePath,
    storage_bucket: BUCKET,
    description: description ?? null,
  });
}
