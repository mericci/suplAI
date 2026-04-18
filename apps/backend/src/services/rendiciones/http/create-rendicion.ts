import { createRendicion } from '../handlers/index.js';
import { successResponse, validationError, serverError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import type { RequestContext } from '../../../types/api.js';

export async function createRendicionHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgIdx = segments.indexOf('organizations');
    const orgId = segments[orgIdx + 1];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!context.userId) return serverError('User ID not available');

    const body = await req.json() as unknown;
    const rendicion = await createRendicion(orgId, context.userId, body);
    return successResponse(rendicion, 'Rendicion created', 201);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found') || msg.includes('Invalid') || msg.includes('required')) {
      return validationError(msg);
    }
    return serverError(msg);
  }
}
