/**
 * HTTP handler: POST /api/organizations/:orgId/accounting-ids (Edge Function)
 */

import { createAccountingId } from '../handlers/index.ts';
import { successResponse, serverError, validationError } from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import { HttpStatus } from '../../../types/api.ts';

export async function createAccountingIdHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const orgId = segments[segments.length - 2];

    if (!orgId || !isValidUUID(orgId)) return validationError('Invalid organization ID');

    const body = await req.json().catch(() => null);
    if (!body) return validationError('Request body is required');

    const result = await createAccountingId(orgId, body);
    return successResponse(result, 'ID contable creado', HttpStatus.CREATED);
  } catch (error) {
    return serverError(getErrorMessage(error));
  }
}
