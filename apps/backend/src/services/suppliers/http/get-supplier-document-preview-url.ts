/**
 * HTTP handler: GET /api/suppliers/:supplierId/documents/:docId/preview-url
 */

import { getSupplierDocumentPreviewUrl } from '../handlers/index.js';
import {
  successResponse,
  notFoundResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function getSupplierDocumentPreviewUrlHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/suppliers/:supplierId/documents/:docId/preview-url
    const previewUrlIdx = segments.lastIndexOf('preview-url');
    const docId = segments[previewUrlIdx - 1];
    const documentsIdx = segments.lastIndexOf('documents');
    const supplierId = segments[documentsIdx - 1];

    if (!supplierId || !isValidUUID(supplierId)) {
      return validationError('Invalid supplier ID format');
    }
    if (!docId || !isValidUUID(docId)) {
      return validationError('Invalid document ID format');
    }

    const result = await getSupplierDocumentPreviewUrl(supplierId, docId);
    return successResponse(result);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Document');
    return serverError(msg);
  }
}
