import { listUserPaymentInfo } from '../handlers/index.js';
import { successResponse, serverError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import type { RequestContext } from '../../../types/api.js';

export async function listUserPaymentInfoHandler(
  _req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    if (!context.userId) return serverError('User ID not available');
    const infos = await listUserPaymentInfo(context.userId);
    return successResponse(infos);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
