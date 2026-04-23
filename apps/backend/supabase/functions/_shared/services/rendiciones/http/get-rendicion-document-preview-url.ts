import { getRendicionDocumentPreviewUrl } from '../handlers/index.ts';
import { successResponse, validationError, notFoundResponse, serverError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function getRendicionDocumentPreviewUrlHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgIdx = segments.indexOf('organizations');
    const orgId = segments[orgIdx + 1];
    const rendicionId = segments[orgIdx + 3];
    const docId = segments[orgIdx + 5];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!rendicionId || !isValidUUID(rendicionId)) return validationError('Invalid rendicion ID');
    if (!docId || !isValidUUID(docId)) return validationError('Invalid document ID');

    const result = await getRendicionDocumentPreviewUrl(orgId, rendicionId, docId);
    return successResponse(result);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Document');
    return serverError(msg);
  }
}
