/**
 * HTTP handler: POST /api/organizations/lookup-sii
 *
 * Public endpoint — no auth required.
 * Authenticates with SII and returns the company's razón social.
 */

import { lookupSii } from '../handlers/index.js';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';

export async function lookupSiiHandler(req: Request): Promise<Response> {
  try {
    const body = await req.json();

    if (!body || typeof body !== 'object') {
      return validationError('Invalid request body');
    }

    const result = await lookupSii(body);
    return successResponse(result);
  } catch (error) {
    const msg = getErrorMessage(error);

    if ((error as { code?: string }).code === 'VALIDATION_ERROR') {
      return validationError(msg);
    }

    return serverError(msg);
  }
}
