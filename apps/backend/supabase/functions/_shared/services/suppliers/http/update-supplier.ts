/**
 * HTTP handler: PUT /api/suppliers/:id
 */

import { updateSupplier } from '../handlers/index.ts';
import {
  successResponse,
  notFoundResponse,
  validationError,
  errorResponse,
  serverError,
} from '../../../utils/response.ts';
import { getErrorMessage } from '../../../utils/error.ts';
import { isValidUUID } from '../../../utils/validation.ts';
import { HttpStatus } from '../../../types/api.ts';

export async function updateSupplierHandler(req: Request): Promise<Response> {
  try {
    const url = new URL(req.url);
    const segments = url.pathname.split('/');
    const id = segments[segments.length - 1];

    if (!id || !isValidUUID(id)) return validationError('Invalid supplier ID format');

    const body = await req.json();
    if (!body || typeof body !== 'object') return validationError('Invalid request body');

    const supplier = await updateSupplier(id, body);
    return successResponse(supplier, 'Supplier updated successfully');
  } catch (error) {
    const msg = getErrorMessage(error);
    if (msg.includes('not found')) return notFoundResponse('Supplier');
    if (msg.includes('already exists')) return errorResponse(msg, HttpStatus.CONFLICT);
    return serverError(msg);
  }
}
