import { deleteUserPaymentInfo } from '../handlers/index.ts';
import { successResponse, validationError, notFoundResponse, serverError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import type { RequestContext } from '../../../types/api.ts';

export async function deleteUserPaymentInfoHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.userId) return serverError('User ID not available');
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const infoId = segments[segments.length - 1];
    if (!infoId || !isValidUUID(infoId)) return validationError('Invalid payment info ID');
    await deleteUserPaymentInfo(infoId, context.userId);
    return successResponse(null, 'Payment info deleted');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Payment info');
    return serverError(msg);
  }
}
