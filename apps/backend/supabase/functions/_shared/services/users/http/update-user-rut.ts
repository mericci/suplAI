import { updateUserRut } from '../handlers/index.ts';
import { successResponse, validationError, serverError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { RequestContext } from '../../../types/api.ts';

export async function updateUserRutHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.userId) return serverError('User ID not available');
    const body = await req.json() as unknown;
    const updated = await updateUserRut(context.userId, body);
    return successResponse(updated);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('already set') || msg.includes('Invalid') || msg.includes('required')) {
      return validationError(msg);
    }
    return serverError(msg);
  }
}
