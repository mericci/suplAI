/**
 * HTTP handler: POST /api/suppliers/:supplierId/documents (Edge Function)
 */

import { createSupplierDocument } from '../handlers/index.ts';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function createSupplierDocumentHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
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
