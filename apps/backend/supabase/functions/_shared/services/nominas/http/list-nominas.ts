/**
 * HTTP handler: GET /api/organizations/:orgId/nominas (Edge Function)
 */

import { listNominas } from '../handlers/index.ts';
import {
  successResponse,
  validationError,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';

export async function listNominasHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const nominas = await listNominas(orgId);
    return successResponse(nominas);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
