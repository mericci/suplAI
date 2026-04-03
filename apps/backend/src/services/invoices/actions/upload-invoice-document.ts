/**
 * Upload Invoice Document Action
 *
 * Stores a file in Supabase Storage and records metadata in invoice_documents.
 */

import { logger } from '../../../utils/logger.js';
import * as invoiceDb from '../../../db/invoice.db.js';
import * as docDb from '../../../db/invoice-document.db.js';
import type { InvoiceDocumentRow } from '../../../db/invoice-document.db.js';
import { supabase } from '../../../lib/supabase.js';
import { getErrorMessage } from '../../../utils/error.js';

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
  try {
    const existing = await invoiceDb.findById(invoiceId, organizationId);
    if (!existing) throw new Error('Invoice not found');

    const storagePath = `${organizationId}/${invoiceId}/${Date.now()}-${fileName}`;

    const { error: uploadError } = await supabase.storage
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
  } catch (error) {
    logger.error('Error uploading invoice document', { error: getErrorMessage(error) });
    throw error;
  }
}
