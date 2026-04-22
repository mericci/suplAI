import { createRendicion } from '../handlers/index.ts';
import { successResponse, validationError, notFoundResponse, serverError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import * as userDb from '../../../db/user.db.ts';
import type { RequestContext } from '../../../types/api.ts';

export async function createRendicionHandler(
  req: Request,
  context: RequestContext,
): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgIdx = segments.indexOf('organizations');
    const orgId = segments[orgIdx + 1];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');
    if (!context.email) return serverError('User email not available');

    const user = await userDb.findByEmail(context.email);
    if (!user) return notFoundResponse('User');

    const body = await req.json() as unknown;
    const rendicion = await createRendicion(orgId, user.id, body);
    return successResponse(rendicion, 'Rendicion created', 201);
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found') || msg.includes('Invalid') || msg.includes('required')) {
      return validationError(msg);
    }
    return serverError(msg);
  }
}
