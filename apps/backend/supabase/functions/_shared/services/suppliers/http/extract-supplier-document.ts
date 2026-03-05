/**
 * HTTP handler: POST /api/suppliers/extract-from-document (Edge Function)
 */

import { extractSupplierDocument } from '../handlers/index.ts';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function getMimeType(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const extMap: Record<string, string> = {
    pdf: 'application/pdf',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
  };
  return extMap[ext] ?? 'application/octet-stream';
}

export async function extractSupplierDocumentHandler(req: Request): Promise<Response> {
  try {
    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return validationError('Request must be multipart/form-data');
    }

    const formData = await req.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return validationError('Missing required field: file');
    }

    if (file.size > MAX_FILE_SIZE) {
      return validationError('File size exceeds 10MB limit');
    }

    const mimeType = getMimeType(file);
    const supportedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(mimeType)) {
      return validationError(`Unsupported file type: ${mimeType}`);
    }

    const buffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(buffer);

    const extracted = await extractSupplierDocument(fileBytes, mimeType, file.name);
    return successResponse(extracted);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
