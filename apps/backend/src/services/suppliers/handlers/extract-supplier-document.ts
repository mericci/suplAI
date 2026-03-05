import type { ExtractedDocumentData } from '@supl/shared';
import { extractSupplierDocument as extractAction } from '../actions/extract-supplier-document.js';

export async function extractSupplierDocument(
  fileBytes: Uint8Array,
  mimeType: string,
  fileName: string,
): Promise<ExtractedDocumentData> {
  return extractAction(fileBytes, mimeType, fileName);
}
