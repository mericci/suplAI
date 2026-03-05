/**
 * HTTP handler: GET /api/suppliers/:supplierId/documents (Edge Function)
 */

import { listSupplierDocuments } from '../handlers/index.ts';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function listSupplierDocumentsHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
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
