/**
 * HTTP handler: POST /api/organizations
 */

import { createOrganization } from '../handlers/index.js';
import {
  successResponse,
  validationError,
  errorResponse,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { HttpStatus } from '../../../types/api.js';

export async function createOrganizationHandler(
  req: Request,
): Promise<Response> {
  try {
    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return validationError('Invalid request body');
    }

    const org = await createOrganization(body);

    return successResponse(
      org,
      'Organization created successfully',
      HttpStatus.CREATED,
    );
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('already exists')) return errorResponse(msg, HttpStatus.CONFLICT);
    if (msg.includes('validation') || msg.toLowerCase().includes('invalid')) {
      return validationError(msg);
    }
    return serverError(msg);
  }
}
