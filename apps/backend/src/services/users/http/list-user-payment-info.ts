import { listUserPaymentInfo } from '../handlers/index.js';
import { successResponse, notFoundResponse, serverError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import * as userDb from '../../../db/user.db.js';
import type { RequestContext } from '../../../types/api.js';

export async function listUserPaymentInfoHandler(
  _req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.email) return serverError('User email not available');
    const user = await userDb.findByEmail(context.email);
    if (!user) return notFoundResponse('User');
    const infos = await listUserPaymentInfo(user.id);
    return successResponse(infos);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
