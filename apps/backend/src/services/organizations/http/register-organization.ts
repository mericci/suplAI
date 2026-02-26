/**
 * HTTP handler: POST /api/organizations/register
 *
 * Public endpoint — no auth required.
 * Creates a new organization and optionally registers the first admin user.
 */

import { registerOrganization } from '../handlers/index.js';
import {
  successResponse,
  validationError,
  errorResponse,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { HttpStatus } from '../../../types/api.js';

export async function registerOrganizationHandler(
  req: Request,
): Promise<Response> {
  try {
    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return validationError('Invalid request body');
    }

    const result = await registerOrganization(body);

    return successResponse(result, 'Organization created successfully');
  } catch (error) {
    const msg = getErrorMessage(error);

    if ((error as { code?: string }).code === 'VALIDATION_ERROR') {
      return validationError(msg);
    }

    if (
      (error as { code?: string }).code === 'CONFLICT'
      || msg.includes('already exists')
    ) {
      return errorResponse(msg, HttpStatus.CONFLICT);
    }

    if (
      msg.toLowerCase().includes('validation')
      || msg.toLowerCase().includes('invalid')
      || msg.toLowerCase().includes('required')
      || msg.toLowerCase().includes('must be')
      || msg.toLowerCase().includes('must contain')
    ) {
      return validationError(msg);
    }

    return serverError(msg);
  }
}
