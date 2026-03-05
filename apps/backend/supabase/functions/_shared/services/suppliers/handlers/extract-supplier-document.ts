import { extractSupplierDocument as extractAction } from '../actions/extract-supplier-document.ts';
import type { ExtractedDocumentData } from '../../../types/supplier-document.ts';

export async function extractSupplierDocument(
  fileBytes: Uint8Array,
  mimeType: string,
  fileName: string,
): Promise<ExtractedDocumentData> {
  return extractAction(fileBytes, mimeType, fileName);
}
