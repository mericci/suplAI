/**
 * Get Supplier Document Preview URL Action
 *
 * Generates a signed URL for previewing a document stored in Supabase Storage.
 */

import { logger } from '../../../utils/logger.js';
import * as supplierDocumentDb from '../../../db/supplier-document.db.js';
import { getErrorMessage } from '../../../utils/error.js';
import { supabaseAdmin } from '../../../lib/supabase.js';

const SIGNED_URL_EXPIRY_SECONDS = 3600; // 1 hour

export async function getSupplierDocumentPreviewUrl(
  supplierId: string,
  docId: string,
): Promise<{ signedUrl: string; fileName: string }> {
  try {
    logger.info('Generating preview URL', { supplierId, docId });

    const doc = await supplierDocumentDb.findById(docId);
    if (!doc) throw new Error('Document not found');
    if (doc.supplier_id !== supplierId) throw new Error('Document not found');

    const { data, error } = await supabaseAdmin().storage
      .from(doc.storage_bucket)
      .createSignedUrl(doc.storage_path, SIGNED_URL_EXPIRY_SECONDS);

    if (error) throw new Error(`Storage error: ${error.message}`);
    if (!data?.signedUrl) throw new Error('Failed to generate signed URL');

    return { signedUrl: data.signedUrl, fileName: doc.file_name };
  } catch (error) {
    logger.error('Error generating preview URL', { error: getErrorMessage(error) });
    throw error;
  }
}
