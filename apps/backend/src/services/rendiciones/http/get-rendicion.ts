import { getRendicion } from '../handlers/index.js';
import { successResponse, validationError, notFoundResponse, serverError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function getRendicionHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgIdx = segments.indexOf('organizations');
    const orgId = segments[orgIdx + 1];
    const rendicionId = segments[segments.length - 1];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!rendicionId || !isValidUUID(rendicionId)) return validationError('Invalid rendicion ID');

    const rendicion = await getRendicion(rendicionId, orgId);
    return successResponse(rendicion);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Rendicion');
    return serverError(msg);
  }
}
