import { getSupplierDocumentPreviewUrl as getUrlAction } from '../actions/get-supplier-document-preview-url.js';

export async function getSupplierDocumentPreviewUrl(
  supplierId: string,
  docId: string,
): Promise<{ signedUrl: string; fileName: string }> {
  return getUrlAction(supplierId, docId);
}
