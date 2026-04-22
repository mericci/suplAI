import { approveRendicion } from '../handlers/index.js';
import { successResponse, validationError, notFoundResponse, serverError } from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';
import * as userDb from '../../../db/user.db.js';
import type { RequestContext } from '../../../types/api.js';

export async function approveRendicionHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgIdx = segments.indexOf('organizations');
    const orgId = segments[orgIdx + 1];
    const approveIdx = segments.lastIndexOf('approve');
    const rendicionId = segments[approveIdx - 1];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!rendicionId || !isValidUUID(rendicionId)) return validationError('Invalid rendicion ID');
    if (!context.email) return serverError('User email not available');

    const user = await userDb.findByEmail(context.email);
    if (!user) return notFoundResponse('User');

    const body = await req.json().catch(() => ({})) as { aiValidated?: boolean };
    const rendicion = await approveRendicion(
      rendicionId,
      orgId,
      user.id,
      body.aiValidated ?? true,
    );
    return successResponse(rendicion, 'Rendicion approved');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Rendicion');
    if (msg.includes('Cannot approve')) return validationError(msg);
    return serverError(msg);
  }
}
