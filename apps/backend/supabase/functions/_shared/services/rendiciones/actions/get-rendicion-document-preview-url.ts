import { logger } from '../../../utils/logger.ts';
import * as rendicionDocumentDb from '../../../db/rendicion-document.db.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { supabaseAdmin } from '../../../lib/supabase.ts';

const SIGNED_URL_EXPIRY_SECONDS = 3600;

export async function getRendicionDocumentPreviewUrl(
  organizationId: string,
  rendicionId: string,
  docId: string,
): Promise<{ signedUrl: string; fileName: string }> {
  try {
    logger.info('Generating rendicion document preview URL', { organizationId, rendicionId, docId });

    const doc = await rendicionDocumentDb.findById(docId);
    if (!doc) throw new Error('Document not found');
    if (doc.rendicion_id !== rendicionId) throw new Error('Document not found');
    if (doc.organization_id !== organizationId) throw new Error('Document not found');

    const { data, error } = await supabaseAdmin().storage
      .from(doc.storage_bucket)
      .createSignedUrl(doc.storage_path, SIGNED_URL_EXPIRY_SECONDS);

    if (error) throw new Error(`Storage error: ${error.message}`);
    if (!data?.signedUrl) throw new Error('Failed to generate signed URL');

    return { signedUrl: data.signedUrl, fileName: doc.file_name };
  } catch (error) {
    logger.error('Error generating rendicion document preview URL', { error: getErrorMessage(error) });
    throw error;
  }
}
