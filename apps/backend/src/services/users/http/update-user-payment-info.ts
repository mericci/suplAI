import { updateUserPaymentInfo } from '../handlers/index.js';
import { successResponse, validationError, notFoundResponse, serverError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import type { RequestContext } from '../../../types/api.js';

export async function updateUserPaymentInfoHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.userId) return serverError('User ID not available');
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const infoId = segments[segments.length - 1];

    if (!infoId || !isValidUUID(infoId)) return validationError('Invalid payment info ID');

    const body = await req.json() as unknown;
    const updated = await updateUserPaymentInfo(infoId, context.userId, body);
    return successResponse(updated);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Payment info');
    if (msg.includes('Invalid') || msg.includes('required')) return validationError(msg);
    return serverError(msg);
  }
}
