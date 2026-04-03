/**
 * HTTP handler: POST /api/organizations/:orgId/invoices/:id/documents
 */

import { uploadInvoiceDocument } from '../handlers/index.js';
import * as userDb from '../../../db/user.db.js';
import {
  successResponse,
  notFoundResponse,
  validationError,
  serverError,
  unauthorizedResponse,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import type { RequestContext } from '../../../types/api.js';

export async function uploadInvoiceDocumentHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.email) return unauthorizedResponse();

    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/invoices/:id/documents
    const orgId = segments[segments.length - 4];
    const id = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!id || !isValidUUID(id)) return validationError('Invalid invoice ID');

    const formData = await req.formData().catch(() => null);
    if (!formData) return validationError('Expected multipart/form-data');

    const file = formData.get('file') as File | null;
    if (!file) return validationError('file is required');

    const description = (formData.get('description') as string | null) ?? undefined;

    const user = await userDb.findByEmail(context.email);
    if (!user) return unauthorizedResponse();

    const buffer = await file.arrayBuffer();
    const doc = await uploadInvoiceDocument(
      id,
      orgId,
      user.id,
      file.name,
      new Uint8Array(buffer),
      file.type || 'application/octet-stream',
      description,
    );
    return successResponse(doc, 'Document uploaded');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Invoice');
    return serverError(msg);
  }
}
