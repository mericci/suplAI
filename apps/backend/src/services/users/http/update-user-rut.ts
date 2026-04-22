import { updateUserRut } from '../handlers/index.js';
import { successResponse, validationError, serverError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { RequestContext } from '../../../types/api.js';

export async function updateUserRutHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.email) return serverError('User email not available');
    const body = await req.json() as unknown;
    const updated = await updateUserRut(context.email, body);
    return successResponse(updated);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('already set') || msg.includes('Invalid') || msg.includes('required')) {
      return validationError(msg);
    }
    return serverError(msg);
  }
}
