import { listUserPaymentInfo } from '../handlers/index.ts';
import { successResponse, serverError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import type { RequestContext } from '../../../types/api.ts';

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
