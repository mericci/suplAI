import { uploadInvoiceDocument } from '../actions/upload-invoice-document.ts';
import * as userDb from '../../../db/user.db.ts';
import {
  successResponse,
  notFoundResponse,
  validationError,
  serverError,
  unauthorizedResponse,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import type { RequestContext } from '../../../types/api.ts';

export async function uploadInvoiceDocumentHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.email) return unauthorizedResponse();

    const url = new URL(req.url);
    const segments = url.pathname.split('/');
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
