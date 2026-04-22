import { listUserPaymentInfo } from '../handlers/index.ts';
import { successResponse, notFoundResponse, serverError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import * as userDb from '../../../db/user.db.ts';
import type { RequestContext } from '../../../types/api.ts';

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
