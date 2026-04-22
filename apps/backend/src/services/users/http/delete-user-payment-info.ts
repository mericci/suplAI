import { deleteUserPaymentInfo } from '../handlers/index.js';
import { successResponse, validationError, notFoundResponse, serverError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import * as userDb from '../../../db/user.db.js';
import type { RequestContext } from '../../../types/api.js';

export async function deleteUserPaymentInfoHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.email) return serverError('User email not available');
    const user = await userDb.findByEmail(context.email);
    if (!user) return notFoundResponse('User');
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const infoId = segments[segments.length - 1];

    if (!infoId || !isValidUUID(infoId)) return validationError('Invalid payment info ID');

    await deleteUserPaymentInfo(infoId, user.id);
    return successResponse(null, 'Payment info deleted');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Payment info');
    return serverError(msg);
  }
}
