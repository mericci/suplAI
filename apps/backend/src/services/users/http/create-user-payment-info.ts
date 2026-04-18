import { createUserPaymentInfo } from '../handlers/index.js';
import { successResponse, validationError, serverError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { RequestContext } from '../../../types/api.js';

export async function createUserPaymentInfoHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.userId) return serverError('User ID not available');
    const body = await req.json() as unknown;
    const created = await createUserPaymentInfo(context.userId, body);
    return successResponse(created, 'Payment info created', 201);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('Invalid') || msg.includes('required')) return validationError(msg);
    return serverError(msg);
  }
}
