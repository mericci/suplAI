import { updateUserPaymentInfo } from '../handlers/index.ts';
import { successResponse, validationError, notFoundResponse, serverError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import * as userDb from '../../../db/user.db.ts';
import type { RequestContext } from '../../../types/api.ts';

export async function updateUserPaymentInfoHandler(
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
    const body = await req.json() as unknown;
    const updated = await updateUserPaymentInfo(infoId, user.id, body);
    return successResponse(updated);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Payment info');
    if (msg.includes('Invalid') || msg.includes('required')) return validationError(msg);
    return serverError(msg);
  }
}
