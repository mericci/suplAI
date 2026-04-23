import { submitRendicion } from '../handlers/index.ts';
import { successResponse, validationError, notFoundResponse, serverError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function submitRendicionHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgIdx = segments.indexOf('organizations');
    const orgId = segments[orgIdx + 1];
    const submitIdx = segments.lastIndexOf('submit');
    const rendicionId = segments[submitIdx - 1];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!rendicionId || !isValidUUID(rendicionId)) return validationError('Invalid rendicion ID');

    const body = await req.json() as unknown;
    const rendicion = await submitRendicion(rendicionId, orgId, body);
    return successResponse(rendicion, 'Rendicion submitted for review');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Rendicion');
    if (msg.includes('Cannot submit') || msg.includes('obligatoria') || msg.includes('required')) {
      return validationError(msg);
    }
    return serverError(msg);
  }
}
