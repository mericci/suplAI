/**
 * HTTP handler: POST /api/suppliers/:supplierId/documents
 */

import { createSupplierDocument } from '../handlers/index.js';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function createSupplierDocumentHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/suppliers/:supplierId/documents
    const documentsIdx = segments.lastIndexOf('documents');
    const supplierId = segments[documentsIdx - 1];

    if (!supplierId || !isValidUUID(supplierId)) {
      return validationError('Invalid supplier ID format');
    }

    const body = await req.json() as Record<string, unknown>;
    const doc = await createSupplierDocument({ ...body, supplierId });
    return successResponse(doc, 'Document created', 201);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('Invalid') || msg.includes('required')) return validationError(msg);
    return serverError(msg);
  }
}
