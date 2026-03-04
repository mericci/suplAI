/**
 * HTTP handler: GET /api/suppliers/:supplierId/documents
 */

import { listSupplierDocuments } from '../handlers/index.js';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function listSupplierDocumentsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/suppliers/:supplierId/documents
    const documentsIdx = segments.lastIndexOf('documents');
    const supplierId = segments[documentsIdx - 1];

    if (!supplierId || !isValidUUID(supplierId)) {
      return validationError('Invalid supplier ID format');
    }

    const docs = await listSupplierDocuments(supplierId);
    return successResponse(docs);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
