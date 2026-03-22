/**
 * HTTP handler: GET /api/organizations/:orgId/nominas
 */

import { listNominas } from '../handlers/index.js';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.js';
import { getErrorMessage } from '../../../utils/error.js';
import { isValidUUID } from '../../../utils/validation.js';

export async function listNominasHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    // /api/organizations/:orgId/nominas
    const orgId = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const nominas = await listNominas(orgId);
    return successResponse(nominas);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
