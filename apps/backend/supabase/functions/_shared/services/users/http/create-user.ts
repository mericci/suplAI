/**
 * HTTP handler: POST /api/organizations/:orgId/users
 */

import { createUser } from '../handlers/index.ts';
import {
  successResponse,
  serverError,
  validationError,
  errorResponse,
} from '../../../utils/response.ts';
import { isValidEmail, isValidUUID } from '../../../utils/validation.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { HttpStatus } from '../../../types/api.ts';

export async function createUserHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/users
    const orgId = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const body = await req.json();
    if (!body || typeof body !== 'object') return validationError('Invalid request body');

    const bodyObj = body as Record<string, unknown>;
    if (typeof bodyObj.email !== 'string' || !isValidEmail(bodyObj.email)) {
      return validationError('Invalid or missing email');
    }

    const user = await createUser(orgId, body);

    return successResponse(
      user,
      'User created successfully',
      HttpStatus.CREATED,
    );
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('already exists')) return errorResponse(msg, HttpStatus.CONFLICT);
    return serverError(msg);
  }
}
